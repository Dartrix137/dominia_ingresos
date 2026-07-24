#!/bin/sh
# Syncs the Postgres schema before the server starts. The project manages
# schema via `prisma db push` (no migrations/ history yet), so this is the
# production equivalent of the `db:push` dev script — run once per boot.
set -e

# Invoked directly (not via `bunx prisma`): the runner image has no
# package.json, so bunx can't see the pinned version and would instead
# fetch the latest prisma CLI from the registry at every boot.
bun ./node_modules/prisma/build/index.js db push --accept-data-loss

exec bun server.js
