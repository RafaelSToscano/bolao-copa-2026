#!/usr/bin/env bash
# Clone one Supabase project into another: dump ORIGIN, then load into
# DESTINATION. DESTRUCTIVE on DESTINATION — drops the public schema and
# truncates auth + storage tables before restoring.
#
# Reads ORIGIN_DB_URL and DESTINATION_DB_URL from scripts/.env.clone
# (see scripts/.env.clone.example). Both must be Postgres connection
# strings — Supabase dashboard → Project settings → Database →
# Connection string → Direct connection (port 5432).
#
# The dump is written to ./backups/latest/ and overwritten on each run,
# so old dumps don't pile up. Copy that folder aside if you want to keep it.
#
# Usage:
#   ./scripts/db-clone.sh --confirm                        # dump + restore
#   ./scripts/db-clone.sh --confirm --dump-only            # produce backups/latest/ and stop
#   ./scripts/db-clone.sh --confirm --source <backup-dir>  # skip dump; restore <backup-dir>

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat >&2 <<EOF
usage: $0 --confirm [--dump-only | --source <backup-dir>]

  --confirm          Required. Acknowledges DESTINATION will be wiped.
  --dump-only        Dump ORIGIN into backups/latest/ and stop. No restore.
  --source <dir>     Skip dump; restore the given backup directory into DESTINATION.
                     Use this to redo a restore from the previous dump without
                     re-hitting ORIGIN.

Environment (loaded from scripts/.env.clone):
  ORIGIN_DB_URL         Postgres URI for the source project.
  DESTINATION_DB_URL    Postgres URI for the target project (will be wiped).
EOF
  exit 2
}

CONFIRMED=0
DUMP_ONLY=0
SOURCE_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --confirm)      CONFIRMED=1; shift ;;
    --dump-only)    DUMP_ONLY=1; shift ;;
    --source|--from) SOURCE_DIR="${2:-}"; [[ -z "$SOURCE_DIR" ]] && usage; shift 2 ;;
    -h|--help)      usage ;;
    *) echo "unknown flag: $1" >&2; usage ;;
  esac
done

if [[ -n "$SOURCE_DIR" && "$DUMP_ONLY" -eq 1 ]]; then
  echo "error: --source and --dump-only are mutually exclusive" >&2
  exit 2
fi

[[ "$CONFIRMED" -eq 1 ]] || usage

for cmd in supabase psql; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: $cmd not found in PATH" >&2
    exit 1
  fi
done

ENV_FILE="scripts/.env.clone"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found — copy scripts/.env.clone.example and fill it in" >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

need_url() {
  local name="$1"
  local val="${!name:-}"
  if [[ -z "$val" ]]; then
    echo "error: $name is empty in $ENV_FILE" >&2
    exit 1
  fi
}

# Mask credentials when echoing a URL back to the terminal.
mask() { printf '%s' "$1" | sed -E 's#^(postgres(ql)?://)[^@]+@#\1***@#'; }

# ---------------------------------------------------------------- dump

if [[ -z "$SOURCE_DIR" ]]; then
  need_url ORIGIN_DB_URL

  BACKUP_DIR="backups/latest"
  # Wipe the previous dump so a partial re-run can't mix old + new files.
  rm -rf "$BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"

  echo "==> dumping ORIGIN into $BACKUP_DIR"
  echo "    origin: $(mask "$ORIGIN_DB_URL")"

  # Sanity check the connection before the (slow) dump.
  psql "$ORIGIN_DB_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;' >/dev/null

  supabase db dump --db-url "$ORIGIN_DB_URL" --role-only              -f "$BACKUP_DIR/roles.sql"
  supabase db dump --db-url "$ORIGIN_DB_URL"                          -f "$BACKUP_DIR/schema.sql"
  supabase db dump --db-url "$ORIGIN_DB_URL" --data-only --use-copy \
    --schema public                                                   -f "$BACKUP_DIR/data.sql"
  # Skip storage.* tables owned by supabase_storage_admin — the pooler
  # user can't COPY into them on the destination and the restore would
  # abort with "permission denied". These aren't user data we care about
  # cloning (they're used by the storage extension's vector search
  # feature and its own migration log).
  supabase db dump --db-url "$ORIGIN_DB_URL" --data-only --use-copy \
    --schema auth,storage \
    -x storage.buckets_vectors \
    -x storage.vector_indexes \
    -x storage.migrations                                             -f "$BACKUP_DIR/data-managed.sql"

  {
    echo "created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "origin=$(mask "$ORIGIN_DB_URL")"
    echo "supabase_cli=$(supabase --version 2>/dev/null | head -1)"
  } > "$BACKUP_DIR/manifest.txt"

  echo "==> dump complete"
  du -h "$BACKUP_DIR"/*.sql
else
  BACKUP_DIR="$SOURCE_DIR"
  [[ -d "$BACKUP_DIR" ]] || { echo "error: --source directory not found: $BACKUP_DIR" >&2; exit 1; }
  echo "==> reusing existing backup at $BACKUP_DIR"
fi

if [[ "$DUMP_ONLY" -eq 1 ]]; then
  echo "==> --dump-only set, skipping restore"
  exit 0
fi

# ------------------------------------------------------------- restore

need_url DESTINATION_DB_URL

for f in schema.sql data.sql data-managed.sql; do
  [[ -f "$BACKUP_DIR/$f" ]] || { echo "error: missing $f in $BACKUP_DIR" >&2; exit 1; }
done

if [[ "$ORIGIN_DB_URL" == "$DESTINATION_DB_URL" ]]; then
  echo "error: ORIGIN_DB_URL and DESTINATION_DB_URL are identical — refusing to overwrite origin" >&2
  exit 1
fi

echo
echo "==> restoring $BACKUP_DIR into DESTINATION"
echo "    target: $(mask "$DESTINATION_DB_URL")"
echo "    this will DROP the public schema and TRUNCATE auth + storage on the target."

psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;' >/dev/null

# 1. Wipe public so the schema restore is deterministic.
psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
SQL

# 2. Roles — best-effort. Hosted Supabase already owns the built-in roles;
#    CREATE ROLE errors for them are expected and shouldn't abort the run.
if [[ -f "$BACKUP_DIR/roles.sql" ]]; then
  echo "==> applying roles.sql (errors on managed roles are expected)"
  psql "$DESTINATION_DB_URL" -f "$BACKUP_DIR/roles.sql" || true
fi

# 3. Schema (public DDL) — must succeed.
echo "==> applying schema.sql"
psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 -f "$BACKUP_DIR/schema.sql"

# 4. Public data.
echo "==> applying data.sql"
psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$BACKUP_DIR/data.sql"

# 5. Clear staging's default auth + storage rows before loading origin data,
#    so COPY doesn't collide with rows Supabase created at project init.
#
#    Caveats about ownership on hosted Supabase (pooler user, not admin):
#    - No RESTART IDENTITY: managed sequences (e.g. auth.refresh_tokens_id_seq)
#      are owned by supabase_auth_admin. data-managed.sql ends with
#      pg_catalog.setval() calls that realign every sequence after COPY.
#    - Skip anything we can't own: extension-internal tables like
#      storage.migrations, auth.schema_migrations, storage.schema_migrations
#      are owned by *_admin roles and TRUNCATE aborts on them. They're not
#      user data — the storage/auth extensions manage them via their own
#      migration flow. We use `has_table_privilege(current_user, ..., 'TRUNCATE')`
#      to filter to only what our role is allowed to wipe.
echo "==> truncating destination auth + storage tables"
psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname IN ('auth', 'storage')
      AND tablename NOT IN ('schema_migrations', 'migrations')
      AND has_table_privilege(
        current_user,
        format('%I.%I', schemaname, tablename),
        'TRUNCATE'
      )
  LOOP
    EXECUTE format('TRUNCATE %I.%I CASCADE', r.schemaname, r.tablename);
  END LOOP;
END $$;
SQL

# 6. Managed data (auth users/identities/sessions, storage buckets/objects).
echo "==> applying data-managed.sql"
psql "$DESTINATION_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$BACKUP_DIR/data-managed.sql"

echo "==> clone complete"
