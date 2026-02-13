FROM node:20-alpine

WORKDIR /app

COPY apps/thesis-cli/package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml* ./pnpm-lock.yaml
COPY packages/protocol ./packages/protocol
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/thesis-cli ./apps/thesis-cli

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --no-frozen-lockfile

ENTRYPOINT ["node", "apps/thesis-cli/dist/index.js"]
