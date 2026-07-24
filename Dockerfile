FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# .next/standalone already contains server.js, .next/static and public/
# (copied there by the `build` script in package.json). Its own bundled
# node_modules is a next-trace-pruned subset that's missing packages the
# prisma CLI needs at runtime (schema has no migrations/ history yet, so
# `prisma db push` runs on every boot) — the full deps node_modules is
# copied over it instead, superseding the pruned copy.
COPY --from=builder /app/.next/standalone ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
