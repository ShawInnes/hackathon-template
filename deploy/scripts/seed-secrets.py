#!/usr/bin/env python3
"""Seed SSM SecureStrings from a local JSON object without logging values."""
import argparse
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile


def run(args):
    return subprocess.run(args, text=True, capture_output=True, env={**os.environ, "AWS_PAGER": ""})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("environment", choices=["staging", "production"])
    parser.add_argument("file", type=Path, help="JSON object of KEY_NAME: secret value")
    parser.add_argument("--overwrite", action="store_true", help="replace existing parameter values")
    parser.add_argument("--dry-run", action="store_true", help="print parameter names without calling AWS")
    parser.add_argument("--region", help="AWS region; otherwise use the AWS CLI configuration")
    parser.add_argument("--kms-key-id", help="optional customer-managed KMS key")
    args = parser.parse_args()
    # Never source shell files, print supplied values or pass them in argv.
    values = json.loads(args.file.read_text())
    if not isinstance(values, dict) or not all(
        isinstance(k, str) and re.fullmatch(r"[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*", k)
        and isinstance(v, str) and v for k, v in values.items()
    ):
        raise ValueError("Expected a JSON object of KEY_NAME keys and non-empty string values")
    reserved = {"DATABASE_URL", "PORT", "AUTH_URL", "APP_BASE_URL", "APP_NAME", "NAMESPACE", "AUTH_ENABLED"}
    if reserved.intersection(values):
        raise ValueError("Database connection, port, app identity and URL keys are managed by the chart")
    root = Path(__file__).resolve().parents[2]
    remote = subprocess.check_output(["git", "config", "--get", "remote.origin.url"], cwd=root, text=True).strip()
    app = remote.rstrip("/").rsplit("/", 1)[-1].removesuffix(".git").removeprefix("t1-")
    chart = root / "deploy/chart"
    rendered = subprocess.check_output([
        "helm", "template", app, str(chart), "-f", str(chart / "values.yaml"),
        "-f", str(chart / f"values-{args.environment}.yaml"),
        "--set-string", f"appName={app}", "--show-only", "templates/externalsecret.yaml",
    ], text=True)
    match = re.search(r'^\s+path: (".*")$', rendered, re.MULTILINE)
    if not match:
        raise ValueError("Cannot determine the SSM path from the rendered ExternalSecret")
    path = json.loads(match.group(1))
    # Missing AUTH_SECRET gets a generated value on first use; existing values
    # remain untouched. Explicit overwrite requires an explicit AUTH_SECRET.
    if args.overwrite and "AUTH_SECRET" not in values:
        raise ValueError("--overwrite requires an explicit AUTH_SECRET to avoid accidental rotation")
    values.setdefault("AUTH_SECRET", secrets.token_urlsafe(48))
    aws = ["aws"] + (["--region", args.region] if args.region else [])
    for key, value in sorted(values.items()):
        name = f"{path}/{key.lower().replace('_', '-')}"
        if args.dry_run:
            print(f"Would seed {name}")
            continue
        check = run(aws + ["ssm", "get-parameter", "--name", name, "--query", "Parameter.Name", "--output", "text"])
        if check.returncode == 0 and not args.overwrite:
            print(f"Kept {name}")
            continue
        if check.returncode != 0 and "ParameterNotFound" not in check.stderr:
            raise RuntimeError(f"Cannot check {name}; verify AWS credentials and SSM read permissions")
        payload = {"Name": name, "Value": value, "Type": "SecureString", "Overwrite": args.overwrite}
        if args.kms_key_id:
            payload["KeyId"] = args.kms_key_id
        # NamedTemporaryFile is mode 0600; clean up even on CLI errors.
        with tempfile.NamedTemporaryFile(mode="w+", suffix=".json") as handle:
            json.dump(payload, handle)
            handle.flush()
            result = run(aws + ["ssm", "put-parameter", "--cli-input-json", f"file://{handle.name}"])
        if result.returncode:
            # Another seed process may have created the same key concurrently.
            if not args.overwrite and "ParameterAlreadyExists" in result.stderr:
                print(f"Kept {name}")
                continue
            raise RuntimeError(f"Cannot seed {name}; verify SSM write and KMS permissions")
        print(f"Seeded {name}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError, RuntimeError) as error:
        # Do not echo malformed input or captured subprocess output containing secrets.
        print(f"Secret seeding failed ({type(error).__name__}); check input and prerequisites.", file=sys.stderr)
        sys.exit(1)
