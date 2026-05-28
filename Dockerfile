FROM node:22-slim AS deps

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:22-slim AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN corepack enable && pnpm run build

FROM node:22-slim AS runtime

ENV NODE_ENV=production
ENV ZEROTRUE_MCP_TRANSPORT=http
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist

EXPOSE 8787
CMD ["node", "dist/index.js", "http"]
