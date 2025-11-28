#!/bin/bash
set -e

host="$1"
shift
cmd="$@"

echo "🔄 Esperando a PostgreSQL en $host:5432..."

until PGPASSWORD=dalu_pass psql -h "$host" -U "dalu_user" -d "dalu_db_dev" -c '\q'; do
  >&2 echo "PostgreSQL aún no está listo - esperando..."
  sleep 1
done

>&2 echo "✅ PostgreSQL está listo!"
exec $cmd
