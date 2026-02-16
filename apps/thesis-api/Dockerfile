FROM node:20-alpine

WORKDIR /app

COPY package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY apps/thesis-api ./apps/thesis-api
COPY packages/protocol ./packages/protocol
COPY packages/skills ./packages/skills
COPY tsconfig.base.json ./tsconfig.base.json

RUN npm install -g pnpm@10.29.3 && \
    pnpm install --no-frozen-lockfile && \
    pnpm --filter @thesis/api build

ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "apps/thesis-api/dist/index.js"]
