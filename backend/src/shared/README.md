# Shared Module Rules

## Purpose
This folder contains **truly cross-layer primitives only**. It exists to prevent duplication of generic utilities across layers.

## What Belongs Here
✅ Generic error base classes (AppError, ValidationError)
✅ Cross-layer type primitives (Nullable, PaginationParams)
✅ Generic API response wrappers (ApiResponse)
✅ Universal validators (email format, etc.)

## What Does NOT Belong Here
❌ Domain-specific logic → belongs in `domain/`
❌ Business rules → belongs in `domain/`
❌ Database types → belongs in `persistence/`
❌ HTTP concerns → belongs in `api/`
❌ Platform-specific code → belongs in `integrations/`

## Anti-Pattern Warning
**Do not let this become a dumping ground.** If you're unsure where code belongs, it probably doesn't belong in `shared/`.

## Review Checklist
Before adding to `shared/`, ask:
1. Is this used by 3+ different layers?
2. Is this truly generic (not domain-specific)?
3. Would duplicating this code be worse than sharing it?

If you answered "no" to any question, find a better home for the code.
