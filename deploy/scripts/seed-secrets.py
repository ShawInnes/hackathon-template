#!/usr/bin/env python3
"""Interactively bootstrap the application's shared SSM SecureStrings."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
import warnings

RESERVED = {"DATABASE_URL", "PORT", "AUTH_URL", "APP_BASE_URL", "APP_NAME", "NAMESPACE", "AUTH_ENABLED"}


def run(args):
    return subprocess.run(args, text=True, capture_output=True, env={**os.environ, "AWS_PAGER": ""})


def variable_name(value):
    key = value.strip().upper().replace("-", "_")
    if not re.fullmatch(r"[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*", key):
        raise ValueError("Use a variable such as OPENAI_API_KEY or openai-api-key")
    if key in RESERVED:
        raise ValueError(f"{key} is managed by the chart")
    return key


def is_secret_name(key):
    if key in RESERVED or key.startswith(("NEXT_PUBLIC_", "VITE_PUBLIC_", "PUBLIC_")):
        return False
    return bool(re.search(
        r"(?:^|_)(?:SECRET|TOKEN|PASSWORD|PASSPHRASE)(?:_|$)|"
        r"(?:^|_)(?:API|PRIVATE|ACCESS|SIGNING|ENCRYPTION)_KEY(?:_|$)", key
    ))


def discover_secrets(root, extra_files=()):
    """Suggest names only; never evaluate files or use their example values."""
    sources = {}
    examples = set()
    for pattern in [".env.example", ".env.sample", ".env.template", ".env.*.example", ".env.*.sample", ".env.*.template"]:
        examples.update(root.glob(pattern))
    for name in extra_files:
        file = Path(name)
        if not file.is_absolute():
            file = root / file
        if not file.is_file():
            raise RuntimeError(f"Discovery file does not exist: {name}")
        examples.add(file)
    files = {file: True for file in examples}
    ignored = {"node_modules", "generated", ".next", ".git", "dist", "build", "coverage", "__pycache__"}
    for directory in ["src", "worker", "scripts"]:
        for file in (root / directory).rglob("*"):
            if not ignored.intersection(file.relative_to(root).parts) and file.suffix in {".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs", ".py"}:
                files.setdefault(file, False)
    for file, example in sorted(files.items()):
        if not file.is_file() or file.is_symlink():
            continue
        content = file.read_text(encoding="utf-8", errors="replace")
        if example:
            # Capture only names from dotenv declarations, including commented
            # optional declarations. Values are deliberately never parsed.
            names = re.findall(r"^\s*(?:#\s*)?(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=", content, re.MULTILINE)
        else:
            names = re.findall(r"(?:process\.env|import\.meta\.env)\.([A-Z][A-Z0-9_]*)", content)
            names += re.findall(r"(?:process\.env|os\.environ)\[\s*[\"']([A-Z][A-Z0-9_]*)[\"']\s*\]", content)
            names += re.findall(r"(?:\benv|os\.getenv|os\.environ\.get)\(\s*[\"']([A-Z][A-Z0-9_]*)[\"']", content)
            names += re.findall(r"^\s*([A-Z][A-Z0-9_]*)\s*:\s*z\.", content, re.MULTILINE)
        label = str(file.relative_to(root)) if file.is_relative_to(root) else str(file)
        for key in names:
            if is_secret_name(key) and key != "AUTH_SECRET":
                sources.setdefault(key, set()).add(label)
    return {key: sorted(locations) for key, locations in sorted(sources.items())}


def offer_discovered(candidates, path, aws, args):
    for key, locations in candidates.items():
        print(f"Suggested {key} ({', '.join(locations)})")
        while True:
            answer = input(f"Seed {key}? [y/N]: ").strip().lower()
            if answer in {"", "n", "no"}:
                break
            if answer in {"y", "yes"}:
                seed_parameter(key, path, aws, args)
                break
            print("Enter y or n.")


def shared_path(root):
    remote = subprocess.check_output(["git", "config", "--get", "remote.origin.url"], cwd=root, text=True).strip()
    app = remote.rstrip("/").rsplit("/", 1)[-1].removesuffix(".git").removeprefix("t1-")
    chart = root / "deploy/chart"
    # Both environments use the base chart's shared path. No environment overlay.
    rendered = subprocess.check_output([
        "helm", "template", app, str(chart), "-f", str(chart / "values.yaml"),
        "--set-string", f"appName={app}", "--show-only", "templates/externalsecret.yaml",
    ], text=True)
    match = re.search(r'^\s+path: (".*")$', rendered, re.MULTILINE)
    if not match:
        raise RuntimeError("Cannot determine the shared SSM path from the rendered ExternalSecret")
    return json.loads(match.group(1))


def secret_value(prompt):
    # getpass normally falls back to echoed input if terminal controls fail.
    with warnings.catch_warnings():
        warnings.simplefilter("error", getpass.GetPassWarning)
        try:
            return getpass.getpass(prompt)
        except getpass.GetPassWarning:
            raise RuntimeError("A terminal with hidden input is required") from None


def seed_parameter(key, path, aws, args):
    name = f"{path}/{key.lower().replace('_', '-')}"
    exists = False
    if not args.dry_run:
        check = run(aws + ["ssm", "get-parameter", "--name", name, "--query", "Parameter.Name", "--output", "text"])
        exists = check.returncode == 0
        if exists and not args.overwrite:
            print(f"Kept {name}")
            return
        if check.returncode and "ParameterNotFound" not in check.stderr:
            raise RuntimeError(f"Cannot check {name}; verify AWS credentials and SSM read permissions")
    if key == "AUTH_SECRET" and not exists:
        value = secret_value("AUTH_SECRET value (hidden; Enter generates a random secret): ")
        if not value:
            value = secrets.token_urlsafe(48)
    else:
        while True:
            value = secret_value(f"{key} value (hidden; Enter keeps existing): " if exists else f"{key} value (hidden): ")
            if value:
                break
            if exists:
                print(f"Kept {name}")
                return
            print("Enter a non-empty value.")
    if args.dry_run:
        print(f"Would seed {name}")
        return
    payload = {"Name": name, "Value": value, "Type": "SecureString", "Overwrite": args.overwrite}
    if args.kms_key_id:
        payload["KeyId"] = args.kms_key_id
    # Keep values out of argv and output. NamedTemporaryFile is mode 0600.
    with tempfile.NamedTemporaryFile(mode="w+", suffix=".json") as handle:
        json.dump(payload, handle)
        handle.flush()
        result = run(aws + ["ssm", "put-parameter", "--cli-input-json", f"file://{handle.name}"])
    if result.returncode:
        if not args.overwrite and "ParameterAlreadyExists" in result.stderr:
            print(f"Kept {name}")
            return
        raise RuntimeError(f"Cannot seed {name}; verify SSM write and KMS permissions")
    print(f"Seeded {name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--overwrite", action="store_true", help="allow replacing existing values interactively")
    parser.add_argument("--dry-run", action="store_true", help="prompt and print parameter names without calling AWS")
    parser.add_argument("--region", help="AWS region; otherwise use the AWS CLI configuration")
    parser.add_argument("--kms-key-id", help="optional customer-managed KMS key")
    parser.add_argument("--scan-file", action="append", default=[], metavar="PATH",
                        help="also discover names in an env example file (repeatable)")
    parser.add_argument("--no-discover", action="store_true", help="skip suggested secrets and enter names manually")
    args = parser.parse_args()
    # Never fall back to visibly echoed secret input on a non-interactive stream.
    if not sys.stdin.isatty():
        raise RuntimeError("Run this bootstrap command in an interactive terminal")
    root = Path(__file__).resolve().parents[2]
    path = shared_path(root)
    candidates = {} if args.no_discover else discover_secrets(root, args.scan_file)
    aws = ["aws"] + (["--region", args.region] if args.region else [])
    print(f"Shared SSM path: {path} (staging and production)")
    print("Existing values are kept unless --overwrite is supplied.")
    seed_parameter("AUTH_SECRET", path, aws, args)
    offer_discovered(candidates, path, aws, args)
    while True:
        entered = input("Variable name (Enter to finish): ").strip()
        if not entered:
            break
        try:
            key = variable_name(entered)
        except ValueError as error:
            print(error)
            continue
        seed_parameter(key, path, aws, args)
    print("Bootstrap complete.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nBootstrap stopped; parameters already seeded are retained.", file=sys.stderr)
        sys.exit(130)
    except RuntimeError as error:
        print(f"Secret seeding failed: {error}", file=sys.stderr)
        sys.exit(1)
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        # Do not print captured subprocess output, which may contain credentials.
        print(f"Secret seeding failed ({type(error).__name__}); check prerequisites.", file=sys.stderr)
        sys.exit(1)
