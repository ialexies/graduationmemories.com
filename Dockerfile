FROM node:20-alpine AS build

WORKDIR /app

# Build frontend
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install server deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm ci --omit=dev

# Runtime
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/server ./server
COPY --from=build /app/public ./public
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
