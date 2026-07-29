# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies untuk argon2 (native)
RUN apk add --no-cache python3 make g++

COPY package.json ./
COPY prisma ./prisma/
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Jalankan sebagai non-root
USER node
EXPOSE 4000

# Terapkan migrasi lalu jalankan
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
