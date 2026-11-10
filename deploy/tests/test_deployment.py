"""Offline behavior checks. No AWS, Docker daemon or Kubernetes connection."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def executable(path, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body)
    path.chmod(0o755)


class DeployTests(unittest.TestCase):
    def invoke(self, environment="staging", extra=None, fail=""):
        with tempfile.TemporaryDirectory() as directory:
            temp = Path(directory)
            log = temp / "calls"
            executable(temp / "git", '#!/bin/sh\nprintf "git@example.test:team/t1-example.git\\n"\n')
            for command in ["helm", "kubectl"]:
                executable(temp / command, '''#!/usr/bin/env python3
import json, os, sys
with open(os.environ["CALL_LOG"], "a") as handle:
    handle.write(json.dumps([os.path.basename(sys.argv[0])] + sys.argv[1:]) + "\\n")
if os.environ.get("FAIL_COMMAND") == os.path.basename(sys.argv[0]):
    sys.exit(9)
''')
            env = {**os.environ, "PATH": f"{temp}:{os.environ['PATH']}", "CALL_LOG": str(log),
                   "FAIL_COMMAND": fail, "ADOPT_EXISTING_RESOURCES": "false",
                   "CNPG_BACKUP_BUCKET": "", "CNPG_BACKUP_ROLE": "", **(extra or {})}
            result = subprocess.run(["bash", str(ROOT / "deploy/scripts/deploy.sh"), environment,
                                     "012345", "registry.test"], cwd=temp, env=env,
                                    text=True, capture_output=True)
            calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            return result, calls

    def test_default_deploy_and_secret_restart(self):
        result, calls = self.invoke()
        self.assertEqual(result.returncode, 0, result.stderr)
        helm = calls[0]
        self.assertIn("example-staging", helm)
        self.assertIn("app-example-staging", helm)
        self.assertIn("image.tag=012345", helm)
        self.assertNotIn("--take-ownership", helm)
        self.assertEqual([call[1:3] for call in calls[1:]], [
            ["wait", "--for=condition=Ready"], ["rollout", "restart"], ["rollout", "status"]])

    def test_production_adoption_and_backup_overrides(self):
        result, calls = self.invoke("production", {"ADOPT_EXISTING_RESOURCES": "true",
                                                  "CNPG_BACKUP_BUCKET": "backup-bucket",
                                                  "CNPG_BACKUP_ROLE": "arn:aws:iam::123:role/backup"})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--take-ownership", calls[0])
        self.assertIn("app-example", calls[0])
        self.assertIn("postgres.backup.destinationBucket=backup-bucket", calls[0])

    def test_invalid_environment_never_calls_cluster(self):
        result, calls = self.invoke("prodution")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [])

    def test_invalid_adoption_never_calls_cluster(self):
        result, calls = self.invoke(extra={"ADOPT_EXISTING_RESOURCES": "yes"})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [])

    def test_helm_failure_prevents_restart(self):
        result, calls = self.invoke(fail="helm")
        self.assertEqual(result.returncode, 9)
        self.assertEqual(len(calls), 1)

    def test_secret_wait_failure_prevents_restart(self):
        result, calls = self.invoke(fail="kubectl")
        self.assertEqual(result.returncode, 9)
        self.assertEqual(len(calls), 2)


class SeedTests(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location("seed", ROOT / "deploy/scripts/seed-secrets.py")
        self.seed = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.seed)

    def seed_values(self, names=(), values=("",), flags=(), exists=False, denied=False, discovered=None):
        writes = []
        def aws(args):
            if "get-parameter" in args:
                return subprocess.CompletedProcess(args, 0 if exists else 1, "", "AccessDenied" if denied else "ParameterNotFound")
            payload_path = args[-1].removeprefix("file://")
            self.assertEqual(Path(payload_path).stat().st_mode & 0o777, 0o600)
            writes.append(json.loads(Path(payload_path).read_text()))
            self.assertNotIn("top-secret", str(args))
            return subprocess.CompletedProcess(args, 0, "", "")
        output = io.StringIO()
        with patch.object(sys, "argv", ["seed", *flags]), \
             patch.object(sys.stdin, "isatty", return_value=True), \
             patch("builtins.input", side_effect=[*names, ""]), \
             patch.object(self.seed.getpass, "getpass", side_effect=values) as hidden, \
             patch.object(self.seed.subprocess, "check_output", side_effect=[
                 "https://example.test/t1-example.git\n", 'spec:\n  dataFrom:\n    - find:\n        path: "/custom/example"\n']) as render, \
             patch.object(self.seed, "discover_secrets", return_value=discovered or {}) as discovery, \
             patch.object(self.seed, "run", side_effect=aws) as calls, contextlib.redirect_stdout(output):
            self.seed.main()
        self.assertNotIn("top-secret", output.getvalue())
        if "--no-discover" in flags:
            discovery.assert_not_called()
        helm = render.call_args_list[1].args[0]
        self.assertFalse(any("values-staging" in arg or "values-production" in arg for arg in helm))
        return writes, output.getvalue(), hidden.call_count, calls.call_count

    def test_new_values_and_generated_auth(self):
        writes, _, _, _ = self.seed_values(["OPENAI_API_KEY"], ["", "top-secret"])
        self.assertEqual([x["Name"] for x in writes], ["/custom/example/auth-secret", "/custom/example/openai-api-key"])
        self.assertTrue(all(x["Type"] == "SecureString" and not x["Overwrite"] for x in writes))
        self.assertGreaterEqual(len(writes[0]["Value"]), 32)

    def test_existing_values_do_not_prompt_for_values(self):
        writes, output, hidden, _ = self.seed_values(["OPENAI_API_KEY"], [], exists=True)
        self.assertEqual(writes, [])
        self.assertEqual(hidden, 0)
        self.assertIn("Kept", output)

    def test_explicit_auth_and_kebab_case_names(self):
        writes, _, _, _ = self.seed_values(["openai-api-key"], ["top-secret", "api-value"])
        self.assertEqual(writes[0]["Value"], "top-secret")
        self.assertEqual(writes[1]["Name"], "/custom/example/openai-api-key")

    def test_explicit_overwrite(self):
        writes, _, _, _ = self.seed_values(values=["top-secret"], flags=["--overwrite"], exists=True)
        self.assertTrue(writes[0]["Overwrite"])

    def test_blank_overwrite_keeps_auth(self):
        writes, output, _, _ = self.seed_values(flags=["--overwrite"], exists=True)
        self.assertEqual(writes, [])
        self.assertIn("Kept", output)

    def test_empty_non_auth_value_reprompts(self):
        writes, output, _, _ = self.seed_values(["OPENAI_API_KEY"], ["", "", "top-secret"])
        self.assertEqual(writes[1]["Value"], "top-secret")
        self.assertIn("non-empty", output)

    def test_dry_run_never_calls_aws(self):
        writes, output, _, calls = self.seed_values(values=["top-secret"], flags=["--dry-run"])
        self.assertEqual(writes, [])
        self.assertEqual(calls, 0)
        self.assertIn("Would seed /custom/example/auth-secret", output)

    def test_access_denied_never_writes(self):
        with self.assertRaises(RuntimeError):
            self.seed_values(denied=True)

    def test_invalid_and_reserved_names_reprompt(self):
        writes, output, _, _ = self.seed_values(["BAD__KEY", "AUTH_URL", "DATABASE_URL", "PORT", "OPENAI_API_KEY"], ["", "top-secret"])
        self.assertEqual(len(writes), 2)
        self.assertIn("managed by the chart", output)

    def test_non_interactive_input_rejected_before_aws(self):
        with patch.object(sys, "argv", ["seed"]), patch.object(sys.stdin, "isatty", return_value=False), \
             patch.object(self.seed, "run") as aws, self.assertRaises(RuntimeError):
            self.seed.main()
        aws.assert_not_called()

    def test_region_and_kms_selection(self):
        writes, _, _, _ = self.seed_values(flags=["--region", "ap-southeast-2", "--kms-key-id", "alias/bootstrap"])
        self.assertEqual(writes[0]["KeyId"], "alias/bootstrap")

    def test_discovery_suggests_then_seeds_only_confirmed_names(self):
        writes, output, _, _ = self.seed_values(["yes"], ["", "top-secret"],
            discovered={"OPENAI_API_KEY": [".env.example", "src/lib/ai.ts"]})
        self.assertEqual(writes[1]["Name"], "/custom/example/openai-api-key")
        self.assertIn(".env.example", output)

    def test_discovery_can_be_declined(self):
        writes, _, hidden, _ = self.seed_values(["no"], [""],
            discovered={"OPENAI_API_KEY": [".env.example"]})
        self.assertEqual(len(writes), 1)
        self.assertEqual(hidden, 1)

    def test_manual_only_option(self):
        self.seed_values(flags=["--no-discover"])

    def test_discovery_examples_and_source_without_local_env_values(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / ".env.example").write_text(
                'AUTH_SECRET="example-secret"\nexport OPENAI_API_KEY="do-not-load"\n'
                '# OPTIONAL_TOKEN=""\nAUTH_OIDC_ID=""\nDATABASE_URL=""\n'
                'NEXT_PUBLIC_API_KEY=""\nINITIAL_ADMIN_EMAILS=""\n')
            (root / ".env.local").write_text('LOCAL_ONLY_SECRET="never-read"\n')
            (root / ".env.production.example").write_text('RESEND_API_KEY=""\n')
            (root / "src/lib").mkdir(parents=True)
            (root / "src/lib/env.ts").write_text(
                'const a = process.env.OPENAI_API_KEY; const b = process.env["CRON_SECRET"];\n'
                'const c = env("SIGNING_KEY");\n  WEBHOOK_SECRET: z.string(),\n')
            found = self.seed.discover_secrets(root)
            self.assertEqual(set(found), {"OPENAI_API_KEY", "OPTIONAL_TOKEN", "RESEND_API_KEY", "CRON_SECRET", "SIGNING_KEY", "WEBHOOK_SECRET"})
            self.assertEqual(found["OPENAI_API_KEY"], [".env.example", "src/lib/env.ts"])
            self.assertNotIn("do-not-load", str(found))
            self.assertNotIn("never-read", str(found))

    def test_discovery_ignores_generated_code_and_symlink_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "src/generated").mkdir(parents=True)
            (root / "src/generated/env.ts").write_text('process.env.GENERATED_SECRET')
            target = root / "private.txt"
            target.write_text('process.env.LINKED_SECRET')
            (root / "src/linked.ts").symlink_to(target)
            self.assertEqual(self.seed.discover_secrets(root), {})

    def test_explicit_example_file_and_missing_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "config").mkdir()
            (root / "config/env.sample").write_text('SERVICE_API_KEY=""\n')
            self.assertEqual(self.seed.discover_secrets(root, ["config/env.sample"]),
                             {"SERVICE_API_KEY": ["config/env.sample"]})
            with self.assertRaises(RuntimeError):
                self.seed.discover_secrets(root, ["missing.sample"])



class EntrypointTests(unittest.TestCase):
    def invoke(self, standalone, args, migration_exit=0):
        with tempfile.TemporaryDirectory() as directory:
            temp = Path(directory)
            log = temp / "calls"
            executable(temp / "node_modules/.bin/prisma", f'#!/bin/sh\necho prisma >> "$CALL_LOG"\nexit {migration_exit}\n')
            for command in ["node", "npm"]:
                executable(temp / command, f'#!/bin/sh\necho "{command} $*" >> "$CALL_LOG"\n')
            if standalone:
                file = temp / ".next/standalone/server.js"
                file.parent.mkdir(parents=True)
                file.touch()
            env = {**os.environ, "PATH": f"{temp}:{os.environ['PATH']}", "CALL_LOG": str(log)}
            result = subprocess.run(["sh", str(ROOT / "docker-entrypoint.sh"), *args], cwd=temp, env=env, capture_output=True)
            return result.returncode, log.read_text().splitlines()

    def test_standalone_uses_generated_server(self):
        code, calls = self.invoke(True, ["npm", "run", "start"])
        self.assertEqual(code, 0)
        self.assertEqual(calls, ["prisma", "node .next/standalone/server.js"])

    def test_regular_build_uses_start(self):
        code, calls = self.invoke(False, ["npm", "run", "start"])
        self.assertEqual(code, 0)
        self.assertEqual(calls, ["prisma", "npm run start"])

    def test_worker_command_is_preserved(self):
        code, calls = self.invoke(True, ["npm", "run", "worker"])
        self.assertEqual(code, 0)
        self.assertEqual(calls, ["prisma", "npm run worker"])

    def test_migration_failure_prevents_start(self):
        code, calls = self.invoke(True, ["npm", "run", "start"], 7)
        self.assertEqual(code, 7)
        self.assertEqual(calls, ["prisma"])


class DockerAssemblyTests(unittest.TestCase):
    def assemble(self, standalone):
        import re
        import shlex
        with tempfile.TemporaryDirectory() as directory:
            temp = Path(directory)
            source, runtime = temp / "source", temp / "runtime"
            source.mkdir()
            for name in ["node_modules/.bin/prisma", ".next/static/style.css", "src/example.ts",
                         "public/icon.svg", "package.json", "package-lock.json", "next.config.ts",
                         "tsconfig.json", "prisma/schema.prisma", "prisma.config.ts",
                         "healthcheck.js", "docker-entrypoint.sh", ".env"]:
                file = source / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(name)
            if standalone:
                file = source / ".next/standalone/.next/server/pages.js"
                file.parent.mkdir(parents=True, exist_ok=True)
                file.touch()
                (source / ".next/standalone/server.js").write_text("server")
            else:
                for name in ["worker/index.ts", "scripts/example.ts"]:
                    file = source / name
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_text(name)
            dockerfile = (ROOT / "Dockerfile").read_text().replace("\\\n", " ")
            command = re.search(r"^RUN mkdir /runtime.*$", dockerfile, re.MULTILINE).group(0)[4:]
            command = command.replace("/runtime", shlex.quote(str(runtime)))
            result = subprocess.run(["sh", "-eu", "-c", command], cwd=source, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((runtime / "node_modules/.bin/prisma").is_file())
            self.assertTrue((runtime / "src/example.ts").is_file())
            self.assertFalse((runtime / ".env").exists())
            if standalone:
                self.assertTrue((runtime / ".next/standalone/public/icon.svg").is_file())
                self.assertTrue((runtime / ".next/standalone/.next/static/style.css").is_file())
            else:
                self.assertTrue((runtime / "worker/index.ts").is_file())
                self.assertTrue((runtime / "scripts/example.ts").is_file())

    def test_standalone_assets_without_optional_workers(self):
        self.assemble(True)

    def test_regular_build_retains_worker_and_scripts(self):
        self.assemble(False)
