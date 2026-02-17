# Testing Guide

This repository has three practical test levels.

## 1. Unit

Fast feedback, no external services required.

```bash
pnpm test:unit
```

Current scope:
- `@thesis/protocol`
- `@thesis/gateway`
- `@thesis/prompt-adapter`
- `@thesis/tools`

## 2. Integration

Requires API running locally.

Terminal 1:

```bash
pnpm --filter @thesis/api dev
```

Terminal 2:

```bash
pnpm test:integration
```

## 3. E2E (CLI flows)

Requires CLI build and API running.

```bash
pnpm --filter @thesis/cli build
pnpm --filter @thesis/api dev
pnpm test:e2e
```

## Fast Local Loop

Use this while iterating in gateway/protocol packages:

```bash
pnpm test:dev
```

## Full Workspace Test Run

Runs all workspace tests except `@thesis/war-room`.
`@thesis/war-room` currently has no tests and is configured with `--passWithNoTests`.

```bash
pnpm test
```

## Common Failures

If CLI phase tests fail with empty output or generic code `1`, check:
- CLI build exists: `apps/thesis-cli/dist/index.js`
- API is reachable at `http://localhost:4000/health` (or `API_URL` override)

The CLI phase tests now fail early with explicit prerequisite errors when these conditions are not met.
