#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DATA_DIR = process.env.ILEAD_PGDATA || join(ROOT, ".tmp", "postgres");
const MODE_FILE = join(DATA_DIR, ".runtime-mode");

function commandExists(command, args = ["--version"]) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

if (!existsSync(MODE_FILE)) {
  console.log("No local runtime marker found. Nothing to stop.");
  process.exit(0);
}

const mode = readFileSync(MODE_FILE, "utf8").trim();

if (mode === "docker" && commandExists("docker", ["compose", "version"])) {
  run("docker", ["compose", "down"]);
  process.exit(0);
}

if (mode === "local" && commandExists("pg_ctl")) {
  run("pg_ctl", ["-D", DATA_DIR, "stop", "-m", "fast"]);
  process.exit(0);
}

console.log(`Runtime mode '${mode}' could not be stopped automatically in this environment.`);
