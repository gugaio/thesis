FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.29.3

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:20-alpine AS api

WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/apps/thesis-api/package.json ./apps/thesis-api/package.json
COPY --from=base /app/packages/protocol/package.json ./packages/protocol/package.json
COPY --from=base /app/packages/skills/package.json ./packages/skills/package.json
COPY --from=base /app/apps/thesis-api/dist ./apps/thesis-api/dist
COPY --from=base /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=base /app/packages/skills/dist ./packages/skills/dist

ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "apps/thesis-api/dist/index.js"]

FROM node:20-alpine AS gateway

WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/apps/thesis-gateway/package.json ./apps/thesis-gateway/package.json
COPY --from=base /app/packages/protocol/package.json ./packages/protocol/package.json
COPY --from=base /app/packages/skills/package.json ./packages/skills/package.json
COPY --from=base /app/apps/thesis-gateway/dist ./apps/thesis-gateway/dist
COPY --from=base /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=base /app/packages/skills/dist ./packages/skills/dist

CMD ["node", "apps/thesis-gateway/dist/index.js"]

FROM node:20-alpine AS cli

WORKDIR /app

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/apps/thesis-cli/package.json ./apps/thesis-cli/package.json
COPY --from=base /app/packages/protocol/package.json ./packages/protocol/package.json
COPY --from=base /app/packages/skills/package.json ./packages/skills/package.json
COPY --from=base /app/apps/thesis-cli/dist ./apps/thesis-cli/dist
COPY --from=base /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=base /app/packages/skills/dist ./packages/skills/dist

ENTRYPOINT ["node", "apps/thesis-cli/dist/index.js"]
