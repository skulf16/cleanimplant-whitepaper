# ── Build-Stage ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Abhängigkeiten installieren (Cache-freundlich)
COPY package.json package-lock.json* ./
RUN npm ci

# Quellcode kopieren und bauen
COPY . .
RUN npm run build

# ── Runtime-Stage ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone-Output von Next.js (schlank, ohne dev-Dependencies)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Geschützte PDFs (nicht öffentlich, nur über /api/download abrufbar)
COPY --from=builder /app/protected-downloads ./protected-downloads

EXPOSE 3000
CMD ["node", "server.js"]
