# ────── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ────── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# PM2 process manager + serve static file server
RUN npm install -g pm2 serve && npm cache clean --force

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./
COPY poc ./poc

RUN chown -R appuser:appgroup /app
USER appuser

# API server
EXPOSE 3000
# Admin POC static server
EXPOSE 4000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
