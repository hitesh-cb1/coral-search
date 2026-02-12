# Bootstrap / Composition Layer

## Purpose
Centralized dependency wiring. All object construction happens here.

## Why This Exists
- **Single source of truth** for dependency graphs
- **Routes stay clean** - no construction noise
- **Easy to swap implementations** - change in one place
- **Testability** - reset functions for test isolation

## Structure
```
repositories.ts  → Constructs repository implementations
services.ts      → Constructs domain services (depends on repositories)
controllers.ts   → Constructs controllers (depends on services)
```

## Usage Pattern
```typescript
// ❌ OLD: Routes construct dependencies
const userRepository = new PostgresUserRepository()
const userService = new UserService(userRepository)
const userController = new UserController(userService)

// ✅ NEW: Routes import ready-to-use controllers
import { getUserController } from '../../bootstrap/controllers'
const userController = getUserController()
```

## Rules
1. **All construction happens here** - no `new` in routes
2. **Singletons by default** - one instance per application lifecycle
3. **Reset functions for tests** - enable test isolation
4. **No business logic** - pure composition only

## Swapping Implementations
To swap Postgres for DynamoDB:
```typescript
// Only change this file:
// src/bootstrap/repositories.ts

export function getUserRepository(): IUserRepository {
  return new DynamoDBUserRepository() // Changed from PostgresUserRepository
}
```

Everything else continues working unchanged.
