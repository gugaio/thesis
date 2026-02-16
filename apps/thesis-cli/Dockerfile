FROM node:20-alpine

WORKDIR /app

COPY package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY apps/thesis-cli ./apps/thesis-cli
COPY packages/protocol ./packages/protocol
COPY tsconfig.base.json ./tsconfig.base.json

RUN npm install -g pnpm@10.29.3 && \
    pnpm install --no-frozen-lockfile

ENTRYPOINT ["node", "apps/thesis-cli/dist/index.js"]
