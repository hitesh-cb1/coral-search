# Background Jobs

## Critical Rules

### ✅ DO:
- Call domain services directly
- Use domain types
- Handle job-specific concerns (retries, idempotency)
- Log job execution

### ❌ DO NOT:
- Call controllers
- Depend on Express Request/Response
- Mix HTTP concerns with job logic

## Pattern

```typescript
// ✅ CORRECT
export async function processEmailQueue() {
  const userService = getUserService()
  const users = await userService.getUsersNeedingEmail()
  
  for (const user of users) {
    await emailService.send(user.email, template)
  }
}

// ❌ WRONG
export async function processEmailQueue(req: Request, res: Response) {
  const controller = new UserController() // NO - don't use controllers
  await controller.getUsers(req, res)     // NO - this is HTTP layer
}
```

## Why This Matters
- **Jobs are not HTTP endpoints** - they're scheduled tasks
- **Controllers are HTTP-specific** - they handle request/response
- **Domain services are reusable** - webhooks, jobs, and APIs all use them

## Architecture
```
Job Scheduler (cron, SQS)
  ↓
Job Handler (orchestration)
  ↓
Domain Service (business logic)
  ↓
Repository (persistence)
```

Controllers are bypassed entirely.

## Job Characteristics
- **Idempotent** - safe to run multiple times
- **Retryable** - handle transient failures
- **Observable** - log start, success, failure
- **Bounded** - timeout protection
