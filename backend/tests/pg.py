"""Throwaway local PostgreSQL for the database tests.

Starts a fresh cluster in a temp folder, loads the Supabase stand-in and the
real migration, and lets tests run SQL as the database owner or as a signed-in
user (role `authenticated` with a user id, the way Supabase does it).
"""
from __future__ import annotations

import glob
import os
import shutil
import socket
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STUB = ROOT / "tests" / "sql" / "supabase_stub.sql"
MIGRATIONS = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))


def _bin(name: str) -> str | None:
    found = shutil.which(name)
    if found:
        return found
    hits = sorted(glob.glob(f"/usr/lib/postgresql/*/bin/{name}"))
    return hits[-1] if hits else None


def available() -> bool:
    return all(_bin(n) for n in ("initdb", "pg_ctl", "psql"))


class SqlError(Exception):
    pass


class LocalPostgres:
    def __init__(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="weeklyplate-pg-")
        self.data = os.path.join(self.tmp, "data")
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            self.port = s.getsockname()[1]
        self._as_postgres = os.geteuid() == 0  # initdb refuses to run as root

    def _run(self, args: list[str], check: bool = True) -> subprocess.CompletedProcess:
        if self._as_postgres:
            args = ["runuser", "-u", "postgres", "--", *args]
        return subprocess.run(args, capture_output=True, text=True, check=check)

    def start(self) -> None:
        if self._as_postgres:
            shutil.chown(self.tmp, user="postgres")
        self._run([_bin("initdb"), "-D", self.data, "-A", "trust", "-U", "postgres", "--no-sync"])
        opts = f"-k {self.tmp} -p {self.port} -c listen_addresses='' -c fsync=off"
        self._run([_bin("pg_ctl"), "-D", self.data, "-o", opts, "-w", "-l",
                   os.path.join(self.tmp, "log"), "start"])
        self.sql(STUB.read_text())
        for m in MIGRATIONS:
            self.sql(m.read_text())

    def stop(self) -> None:
        self._run([_bin("pg_ctl"), "-D", self.data, "-m", "immediate", "stop"], check=False)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def sql(self, sql: str) -> str:
        """Run SQL as the database owner. Raises SqlError with the server message."""
        args = [_bin("psql"), "-h", self.tmp, "-p", str(self.port), "-U", "postgres",
                "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-q"]
        if self._as_postgres:
            args = ["runuser", "-u", "postgres", "--", *args]
        p = subprocess.run(args, input=sql, capture_output=True, text=True)
        if p.returncode != 0:
            raise SqlError(p.stderr.strip())
        return p.stdout.strip()

    def as_user(self, user_id: str, sql: str) -> str:
        """Run SQL as a signed-in app user, with Row Level Security in force."""
        wrapped = (
            "begin;\n"
            "set local role authenticated;\n"
            f"select set_config('request.jwt.claim.sub', '{user_id}', true) \\g /dev/null\n"
            f"{sql}\n"
            "commit;"
        )
        # psql -c does not allow meta-commands mixed with SQL, so feed via stdin.
        args = [_bin("psql"), "-h", self.tmp, "-p", str(self.port), "-U", "postgres",
                "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-q"]
        if self._as_postgres:
            args = ["runuser", "-u", "postgres", "--", *args]
        p = subprocess.run(args, input=wrapped, capture_output=True, text=True)
        if p.returncode != 0:
            raise SqlError(p.stderr.strip())
        return p.stdout.strip()
