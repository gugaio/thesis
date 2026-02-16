# AGENTS.md

This file contains guidelines for agentic coding agents working in the THESIS monorepo.

## Build/Lint/Test Commands

### Root Commands
- `pnpm build` - Build all packages and apps
- `pnpm dev` - Start all services in development mode
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests only
- `pnpm lint` - Run ESLint across all packages
- `pnpm lint:fix` - Auto-fix linting issues

### Single Package Commands
```bash
pnpm --filter @thesis/api build
pnpm --filter @thesis/cli test
pnpm --filter @thesis/protocol lint
```

### Running a Single Test
```bash
# Run specific test file
pnpm --filter @thesis/api vitest run src/index.test.ts

# Run tests in watch mode
pnpm --filter @thesis/protocol vitest

# Run tests matching a pattern
pnpm --filter @thesis/agent-runtime vitest run -- agent-worker
```

### Docker Commands
- `pnpm docker:up` - Build and start all services with Docker Compose
- `pnpm docker:down` - Stop and remove Docker containers

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled: `strict: true`, `noUncheckedIndexedAccess: true`
- Target: ES2022, Module: ESNext
- All unused locals/parameters must be removed or prefixed with `_`
- No implicit returns allowed

### Import/Export Style
- Use ES modules with `.js` extensions in import statements
- Type imports must use `type` keyword: `import type { Foo } from './foo.js'`
- Absolute imports for workspace packages: `import { Session } from '@thesis/protocol'`
- Relative imports for local modules: `import { foo } from './utils.js'`

### Naming Conventions
- Classes: PascalCase (`class SessionRepository {}`)
- Interfaces: PascalCase (`interface CreateSessionInput {}`)
- Functions/Methods: camelCase (`async findById()`)
- Constants: UPPER_SNAKE_CASE (`const MAX_CREDITS = 100`)
- Enums: PascalCase for enum name, UPPER_SNAKE_CASE for values
- Files: kebab-case for utilities, PascalCase for classes (`session.repository.ts`)

### Type Definitions
- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Return types on async functions: `Promise<T>`
- Use readonly for immutable arrays where appropriate

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Operation failed: ${message}`);
}
```

### Repository Pattern
- Classes suffixed with `.repository.ts`
- Constructor dependency injection
- Methods: `create`, `findById`, `listAll`, `update`, `delete`
- Return domain types from `@thesis/protocol`

### Service Layer
- Classes suffixed with `.service.ts`
- Business logic between repositories and routes
- Coordinate multiple repository calls

### Route Handlers
- Functions exported from `routes/` directory
- Fastify instance registration
- Request/response types with generics
- Proper HTTP status codes (201 for created, 404 for not found)

### Testing Conventions
- Test files: `*.test.ts` or `__tests__/*.test.ts`
- Use Vitest globals: `describe`, `it`, `expect`
- Organize tests by feature
- Integration tests test full flows (e.g., fase1.test.ts)
- Unit tests test single functions/classes

### Formatting Notes
- No Prettier configuration - use ESLint rules only
- Consistent indentation (spaces, 2 spaces preferred)
- No trailing whitespace
- Semicolons required

### Environment Requirements
- Node.js: >=20.0.0
- Package manager: pnpm >=8.0.0
- All packages use `"type": "module"`

### Monorepo Structure
- `apps/` - Runtime applications (api, cli, gateway, war-room, agent-runtime)
- `packages/` - Shared packages (protocol, skills, tools, prompt-adapter)
- Workspace dependencies: `"@thesis/*": "workspace:*"`

### Important Constraints
- No comments in production code
- Console logging allowed (no-console rule is off)
- Explicit return types optional
- `any` types trigger warnings but allowed
- Minimal tools approach - only add when needed
- Follow incremental phase-based development (README.md)

### Session Management
- All database operations use parameterized queries
- Date fields use JavaScript `Date` objects
- UUIDs for all entity IDs
- Ledger events for audit trail
