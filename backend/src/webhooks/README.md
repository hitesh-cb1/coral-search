# Webhook Handlers

## Critical Rules

### ✅ DO:
- Call domain services directly
- Use domain types
- Handle webhook-specific validation
- Return appropriate HTTP responses

### ❌ DO NOT:
- Call controllers
- Depend on Express Request/Response in business logic
- Mix HTTP concerns with webhook processing logic

## Pattern

```typescript
// ✅ CORRECT
export async function handleShopifyOrderCreated(payload: ShopifyOrderPayload) {
  // 1. Validate webhook signature (HTTP concern - OK here)
  // 2. Parse payload
  // 3. Call domain service
  const orderService = getOrderService()
  await orderService.createOrder(domainInput)
}

// ❌ WRONG
export async function handleShopifyOrderCreated(req: Request, res: Response) {
  const controller = new OrderController() // NO - don't use controllers
  await controller.createOrder(req, res)   // NO - this is HTTP layer
}
```

## Why This Matters
- **Webhooks are not HTTP endpoints** - they're event handlers
- **Controllers are HTTP-specific** - they handle request/response
- **Domain services are reusable** - webhooks, jobs, and APIs all use them

## Architecture
```
Webhook Payload
  ↓
Webhook Handler (validate, parse)
  ↓
Domain Service (business logic)
  ↓
Repository (persistence)
```

Controllers are bypassed entirely.
