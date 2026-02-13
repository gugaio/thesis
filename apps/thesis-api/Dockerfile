FROM node:20-alpine

WORKDIR /app

COPY apps/thesis-api/package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml* ./pnpm-lock.yaml
COPY packages/protocol ./packages/protocol
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/thesis-api ./apps/thesis-api

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --no-frozen-lockfile && \
    pnpm --filter @thesis/api build

ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "apps/thesis-api/dist/index.js"]
