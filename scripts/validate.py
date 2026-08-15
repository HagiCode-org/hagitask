#!/usr/bin/env python3
"""Validate authored HagiTask preset packages and their referenced resources."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, RefResolver


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_ROOT = ROOT / "schemas" / "task-preset-plugin"
PRESETS_ROOT = ROOT / "presets"


def load_json(path: Path) -> dict:
    try:
        with path.open(encoding="utf-8") as stream:
            value = json.load(stream)
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"{path.relative_to(ROOT)}: invalid JSON: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"{path.relative_to(ROOT)}: expected a JSON object")
    return value


def validate_document(path: Path, schema_name: str) -> dict:
    schema_path = SCHEMA_ROOT / schema_name
    schema = load_json(schema_path)
    document = load_json(path)
    resolver = RefResolver(schema_path.as_uri(), schema)
    errors = sorted(Draft202012Validator(schema, resolver=resolver).iter_errors(document), key=lambda error: list(error.path))
    if errors:
        details = "; ".join(
            f"{'.'.join(map(str, error.path)) or '<root>'}: {error.message}" for error in errors
        )
        raise ValueError(f"{path.relative_to(ROOT)}: {details}")
    return document


def require_resource(package: Path, package_file: Path, reference: str | None) -> None:
    if not reference:
        return
    target = (package_file.parent / reference).resolve()
    try:
        target.relative_to(package.resolve())
    except ValueError as error:
        raise ValueError(f"{package_file.relative_to(ROOT)}: reference escapes package: {reference}") from error
    if not target.exists():
        raise ValueError(f"{package_file.relative_to(ROOT)}: referenced resource does not exist: {reference}")


def validate_preset(package: Path) -> None:
    manifest_path = package / "manifest.json"
    manifest = validate_document(manifest_path, "manifest.schema.json")
    paths = {
        "panel": package / manifest["ui"]["panel"],
        "taskPreset": package / manifest["backend"]["taskPreset"],
        "prompts": package / manifest["backend"]["prompts"],
    }
    if manifest["ui"].get("commands"):
        paths["commands"] = package / manifest["ui"]["commands"]
    for locale, reference in manifest["localization"].get("bundles", {}).items():
        paths[f"locale:{locale}"] = package / reference

    for label, path in paths.items():
        if not path.is_file():
            raise ValueError(f"{manifest_path.relative_to(ROOT)}: {label} resource does not exist: {path.relative_to(package)}")

    validate_document(paths["panel"], "panel.schema.json")
    validate_document(paths["taskPreset"], "task-preset.schema.json")
    prompts = validate_document(paths["prompts"], "prompt-package.schema.json")
    if "commands" in paths:
        validate_document(paths["commands"], "commands.schema.json")
    for label, path in paths.items():
        if label.startswith("locale:"):
            validate_document(path, "locales.schema.json")

    task_preset = load_json(paths["taskPreset"])
    for binding in task_preset.get("inputBindings", []):
        aliases = binding.get("aliases", [])
        if binding.get("input") in aliases:
            raise ValueError(f"{paths['taskPreset'].relative_to(ROOT)}: input binding cannot alias itself: {binding['input']}")
    for reference in prompts.get("partials", {}).values():
        require_resource(package, paths["prompts"], reference)
    for locale in prompts.get("locales", {}).values():
        require_resource(package, paths["prompts"], locale.get("systemTemplate"))
        require_resource(package, paths["prompts"], locale.get("userTemplate"))
    variants = prompts.get("variants", {})
    for entry in variants.get("entries", []):
        require_resource(package, paths["prompts"], entry.get("systemTemplate"))
        require_resource(package, paths["prompts"], entry.get("userTemplate"))
    require_resource(package, paths["prompts"], variants.get("fallback", {}).get("systemTemplate"))
    require_resource(package, paths["prompts"], variants.get("fallback", {}).get("userTemplate"))


def main() -> int:
    failures: list[str] = []
    packages = sorted(path for path in PRESETS_ROOT.iterdir() if path.is_dir())
    for package in packages:
        try:
            validate_preset(package)
            print(f"ok: {package.name}")
        except ValueError as error:
            failures.append(str(error))
    if failures:
        for failure in failures:
            print(f"error: {failure}", file=sys.stderr)
        return 1
    print(f"validated {len(packages)} preset package(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
