"""Convert the project's PostgreSQL database to a Cloudflare D1 SQL export.

The converter uses the PostgreSQL command-line client for read-only exports and
Python's built-in sqlite3 module for the local compatibility database. It never
modifies the source PostgreSQL database.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sqlite3
import subprocess
from pathlib import Path


TYPE_MAP = {
    "uuid": "TEXT",
    "character varying": "TEXT",
    "text": "TEXT",
    "timestamp with time zone": "TEXT",
    "timestamp without time zone": "TEXT",
    "date": "TEXT",
    "boolean": "INTEGER",
    "integer": "INTEGER",
    "bigint": "INTEGER",
    "jsonb": "TEXT",
    "json": "TEXT",
    "ARRAY": "TEXT",
}


def quote_ident(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def psql(psql_path: str, conn_args: list[str], sql: str) -> str:
    result = subprocess.run(
        [psql_path, "-X", "-v", "ON_ERROR_STOP=1", *conn_args, "-At", "-c", sql],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=os.environ.copy(),
    )
    return result.stdout


def introspect(psql_path: str, conn_args: list[str]) -> dict:
    sql = r"""
WITH tables AS (
  SELECT c.oid, c.relname AS name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
), columns AS (
  SELECT t.name AS table_name,
         json_agg(json_build_object(
           'name', a.attname,
           'data_type', CASE WHEN a.atttypid = 1009 THEN 'ARRAY' ELSE format_type(a.atttypid, a.atttypmod) END,
           'not_null', a.attnotnull
         ) ORDER BY a.attnum) AS value
  FROM tables t
  JOIN pg_attribute a ON a.attrelid = t.oid
  WHERE a.attnum > 0 AND NOT a.attisdropped
  GROUP BY t.name
), constraints AS (
  SELECT t.name AS table_name,
         json_agg(json_build_object(
           'name', c.conname,
           'type', c.contype,
           'definition', pg_get_constraintdef(c.oid, true)
         ) ORDER BY c.contype, c.conname) AS value
  FROM tables t
  LEFT JOIN pg_constraint c ON c.conrelid = t.oid
  GROUP BY t.name
), indexes AS (
  SELECT t.name AS table_name,
         coalesce(json_agg(pg_get_indexdef(i.indexrelid) ORDER BY i.indexrelid)
           FILTER (WHERE i.indexrelid IS NOT NULL AND NOT i.indisprimary), '[]'::json) AS value
  FROM tables t
  LEFT JOIN pg_index i ON i.indrelid = t.oid
  GROUP BY t.name
)
SELECT json_build_object(
  'tables', json_agg(json_build_object(
    'name', t.name,
    'columns', coalesce(col.value, '[]'::json),
    'constraints', coalesce(con.value, '[]'::json),
    'indexes', coalesce(idx.value, '[]'::json)
  ) ORDER BY t.name)
)::text
FROM tables t
LEFT JOIN columns col ON col.table_name = t.name
LEFT JOIN constraints con ON con.table_name = t.name
LEFT JOIN indexes idx ON idx.table_name = t.name;
"""
    return json.loads(psql(psql_path, conn_args, sql).strip())


def sqlite_type(postgres_type: str) -> str:
    normalized = re.sub(r"\(.*\)$", "", postgres_type).strip()
    if normalized.endswith("[]"):
        return "TEXT"
    return TYPE_MAP.get(normalized, "TEXT")


def convert_constraint(definition: str) -> str | None:
    value = definition
    postgres_cast = (
        r"::(?:character varying|timestamp with(?:out)? time zone|"
        r"text|uuid|jsonb?|bigint|integer|boolean)(?:\[\])?"
    )
    value = re.sub(postgres_cast, "", value, flags=re.IGNORECASE)
    value = re.sub(
        r"=\s*ANY\s*\(ARRAY\[(.*?)\]\)",
        lambda match: "IN (" + match.group(1) + ")",
        value,
        flags=re.IGNORECASE,
    )
    value = value.replace("NOT VALID", "")
    if "~" in value or "ILIKE" in value.upper():
        return None
    return value.strip()


def convert_index(definition: str) -> str | None:
    value = re.sub(r"\s+USING\s+btree", "", definition, flags=re.IGNORECASE)
    value = re.sub(
        r"::(?:character varying|timestamp with(?:out)? time zone|"
        r"text|uuid|jsonb?|bigint|integer|boolean)(?:\[\])?",
        "",
        value,
        flags=re.IGNORECASE,
    )
    value = value.replace("public.", "")
    if " gin " in value.lower() or " gist " in value.lower():
        return None
    return value + ";"


def build_schema(connection: sqlite3.Connection, metadata: dict) -> list[str]:
    skipped: list[str] = []
    connection.execute("PRAGMA foreign_keys = OFF")
    for table in metadata["tables"]:
        parts = []
        for column in table["columns"]:
            item = f"{quote_ident(column['name'])} {sqlite_type(column['data_type'])}"
            if column["not_null"]:
                item += " NOT NULL"
            parts.append(item)

        for constraint in table["constraints"]:
            if not constraint or not constraint.get("definition"):
                continue
            converted = convert_constraint(constraint["definition"])
            if converted is None:
                skipped.append(f"constraint {constraint['name']} on {table['name']}")
                continue
            parts.append(f"CONSTRAINT {quote_ident(constraint['name'])} {converted}")

        ddl = f"CREATE TABLE {quote_ident(table['name'])} (\n  " + ",\n  ".join(parts) + "\n)"
        connection.execute(ddl)

    for table in metadata["tables"]:
        for definition in table["indexes"]:
            converted = convert_index(definition)
            if converted is None:
                skipped.append(f"index on {table['name']}: {definition}")
                continue
            connection.execute(converted)
    connection.commit()
    return skipped


def copy_data(
    connection: sqlite3.Connection,
    metadata: dict,
    psql_path: str,
    conn_args: list[str],
) -> dict[str, int]:
    counts: dict[str, int] = {}
    for table in metadata["tables"]:
        table_name = table["name"]
        columns = [column["name"] for column in table["columns"]]
        copy_sql = (
            f"COPY public.{quote_ident(table_name)} "
            "TO STDOUT WITH (FORMAT CSV, HEADER TRUE, NULL '\\N')"
        )
        raw = psql(psql_path, conn_args, copy_sql)
        reader = csv.reader(io.StringIO(raw))
        header = next(reader, None)
        if header != columns:
            raise RuntimeError(f"column mismatch for {table_name}: {header!r} != {columns!r}")
        rows = []
        for row in reader:
            rows.append([None if value == r"\N" else value for value in row])
        if rows:
            placeholders = ", ".join("?" for _ in columns)
            column_sql = ", ".join(quote_ident(column) for column in columns)
            connection.executemany(
                f"INSERT INTO {quote_ident(table_name)} ({column_sql}) VALUES ({placeholders})",
                rows,
            )
        counts[table_name] = len(rows)
        connection.commit()
    return counts


def write_d1_sql(connection: sqlite3.Connection, output: Path) -> None:
    lines = [
        "PRAGMA foreign_keys=OFF;",
        "PRAGMA defer_foreign_keys=ON;",
    ]
    for line in connection.iterdump():
        if line in {"BEGIN TRANSACTION;", "COMMIT;"}:
            continue
        lines.append(line)
    lines.extend(["PRAGMA defer_foreign_keys=OFF;", "PRAGMA foreign_keys=ON;"])
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def verify(connection: sqlite3.Connection, expected: dict[str, int]) -> None:
    connection.execute("PRAGMA foreign_keys = ON")
    violations = connection.execute("PRAGMA foreign_key_check").fetchall()
    if violations:
        raise RuntimeError(f"foreign-key violations: {violations[:20]}")
    for table, expected_count in expected.items():
        actual = connection.execute(f"SELECT count(*) FROM {quote_ident(table)}").fetchone()[0]
        if actual != expected_count:
            raise RuntimeError(f"row-count mismatch for {table}: {actual} != {expected_count}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--psql", required=True)
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--sqlite", required=True, type=Path)
    parser.add_argument("--sql", required=True, type=Path)
    args = parser.parse_args()

    conn_args = ["-h", args.host, "-p", args.port, "-U", args.user, "-d", args.database]
    metadata = introspect(args.psql, conn_args)
    args.sqlite.parent.mkdir(parents=True, exist_ok=True)
    args.sql.parent.mkdir(parents=True, exist_ok=True)
    args.sqlite.unlink(missing_ok=True)

    connection = sqlite3.connect(args.sqlite)
    try:
        skipped = build_schema(connection, metadata)
        counts = copy_data(connection, metadata, args.psql, conn_args)
        verify(connection, counts)
        write_d1_sql(connection, args.sql)
    finally:
        connection.close()

    print(json.dumps({
        "tables": len(counts),
        "rows": sum(counts.values()),
        "counts": counts,
        "skipped": skipped,
        "sqlite": str(args.sqlite),
        "sql": str(args.sql),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
