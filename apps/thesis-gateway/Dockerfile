FROM node:20-alpine

WORKDIR /app

COPY package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY apps/thesis-gateway ./apps/thesis-gateway
COPY packages/protocol ./packages/protocol
COPY tsconfig.base.json ./tsconfig.base.json

RUN npm install -g pnpm@10.29.3 && \
    pnpm install --no-frozen-lockfile

CMD ["node", "apps/thesis-gateway/dist/index.js"]
