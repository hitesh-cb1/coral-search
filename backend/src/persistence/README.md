# Persistence Layer

## Critical Rule: Prisma Isolation

**Prisma imports are ONLY allowed in `persistence/postgres/`**

## Enforcement

### ✅ Allowed:
```typescript
// src/persistence/postgres/repositories/user.repository.ts
import { PrismaClient } from '../../../prisma/generated/client'
```

### ❌ Forbidden:
```typescript
// src/domain/user/user.service.ts
import { PrismaClient } from '../../prisma/generated/client' // NO!

// src/api/public/controllers/user.controller.ts
import { User } from '../../../prisma/generated/client' // NO!
```

## Why This Matters

1. **Database Independence** - Domain logic can work with any database
2. **Testability** - Mock repository interfaces, not Prisma
3. **Flexibility** - Swap Postgres for DynamoDB without touching domain
4. **Clear Boundaries** - Persistence concerns stay in persistence layer

## Structure

```
persistence/
├── postgres/           # Prisma-specific implementation
│   ├── client.ts      # Prisma client singleton
│   ├── repositories/  # Implements domain repository interfaces
│   └── mappers/       # Prisma models → Domain models
├── dynamodb/          # Future: DynamoDB implementation
└── redis/             # Future: Redis caching
```

## Mappers Are Required

Never return Prisma types directly. Always map to domain types:

```typescript
// ❌ WRONG
async findById(id: number): Promise<PrismaUser> {
  return this.prisma.user.findUnique({ where: { id } })
}

// ✅ CORRECT
async findById(id: number): Promise<User> {
  const prismaUser = await this.prisma.user.findUnique({ where: { id } })
  return prismaUser ? UserMapper.toDomain(prismaUser) : null
}
```

## Verification

To verify Prisma isolation, search for Prisma imports:

```bash
# Should only find matches in persistence/postgres/
grep -r "from.*prisma/generated" src/
```

If you find imports outside `persistence/postgres/`, fix them immediately.

## Adding New Database

To add DynamoDB support:

1. Create `persistence/dynamodb/repositories/user.repository.ts`
2. Implement `IUserRepository` interface
3. Use DynamoDB client (not Prisma)
4. Map DynamoDB items → Domain models
5. Swap in `bootstrap/repositories.ts`

Domain and API layers remain unchanged.
