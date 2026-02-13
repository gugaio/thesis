FROM node:20-alpine

WORKDIR /app

COPY apps/thesis-gateway/package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml* ./pnpm-lock.yaml
COPY packages/protocol ./packages/protocol
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/thesis-gateway ./apps/thesis-gateway

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --no-frozen-lockfile

CMD ["node", "apps/thesis-gateway/dist/index.js"]
