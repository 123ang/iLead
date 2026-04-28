#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const PORT = process.env.ILEAD_DB_PORT || "55432";
const ROOT = process.cwd();
const DATA_DIR = process.env.ILEAD_PGDATA || join(ROOT, ".tmp", "postgres");
const LOG_DIR = join(ROOT, ".tmp");
const LOG_FILE = join(LOG_DIR, "postgres.log");
const MODE_FILE = join(DATA_DIR, ".runtime-mode");
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://ilead_user:password@127.0.0.1:${PORT}/ilead_db`;

function commandExists(command, args = ["--version"]) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

function usingDocker() {
  return commandExists("docker", ["compose", "version"]);
}

function pgReady() {
  const result = spawnSync("pg_isready", ["-h", "127.0.0.1", "-p", PORT], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function ensureLocalDb() {
  if (!commandExists("initdb") || !commandExists("pg_ctl") || !commandExists("psql")) {
    throw new Error(
      "Neither Docker nor local PostgreSQL tooling is available. Install Docker or PostgreSQL binaries.",
    );
  }

  mkdirSync(LOG_DIR, { recursive: true });

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    run("initdb", ["-D", DATA_DIR, "-A", "trust", "-U", "postgres"]);
  }

  if (!pgReady()) {
    run("pg_ctl", [
      "-D",
      DATA_DIR,
      "-l",
      LOG_FILE,
      "-o",
      `-p ${PORT}`,
      "start",
    ]);
  }

  run("psql", [
    DATABASE_URL.replace("/ilead_db", "/postgres"),
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ilead_user') THEN CREATE ROLE ilead_user LOGIN PASSWORD 'password'; ELSE ALTER ROLE ilead_user WITH LOGIN PASSWORD 'password'; END IF; END $$;",
  ]);
  run("psql", [
    DATABASE_URL.replace("/ilead_db", "/postgres"),
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "SELECT 'CREATE DATABASE ilead_db OWNER ilead_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ilead_db')\\gexec",
  ]);
  run("psql", [
    DATABASE_URL,
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "GRANT ALL PRIVILEGES ON DATABASE ilead_db TO ilead_user;",
  ]);
  writeFileSync(MODE_FILE, "local");
  console.log(`Local PostgreSQL ready at ${DATABASE_URL}`);
}

if (usingDocker()) {
  mkdirSync(DATA_DIR, { recursive: true });
  run("docker", ["compose", "up", "-d", "postgres"]);
  writeFileSync(MODE_FILE, "docker");
  console.log("Docker PostgreSQL started via docker compose.");
} else {
  ensureLocalDb();
  console.log("Docker not available; started local PostgreSQL fallback.");
}
