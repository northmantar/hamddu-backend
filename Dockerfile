# ────── Build stage: Backend ─────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ────── Build stage: Admin ───────────────────────────────────────
FROM node:20-alpine AS admin-builder
WORKDIR /app/admin

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
RUN npm run build

# ────── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# PM2 process manager
RUN npm install -g pm2 && npm cache clean --force

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Backend dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Backend build output
COPY --from=backend-builder /app/dist ./dist
COPY ecosystem.config.js ./

# Admin dependencies and build output
COPY --from=admin-builder /app/admin/package*.json ./admin/
COPY --from=admin-builder /app/admin/node_modules ./admin/node_modules
COPY --from=admin-builder /app/admin/.next ./admin/.next
COPY --from=admin-builder /app/admin/public ./admin/public

RUN chown -R appuser:appgroup /app
USER appuser

# API server
EXPOSE 3000
# Admin dashboard
EXPOSE 4000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
