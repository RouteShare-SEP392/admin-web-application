# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ENV NEXT_PUBLIC_API_MOCK=off
ARG NEXT_PUBLIC_GOONG_MAPTILES_KEY
ENV NEXT_PUBLIC_GOONG_MAPTILES_KEY=$NEXT_PUBLIC_GOONG_MAPTILES_KEY
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_PUBLIC_API_MOCK=off PORT=3001 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3001
CMD ["node", "server.js"]
