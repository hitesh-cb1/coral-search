# CoralBricks Backend - AI Embedding API Service

## Overview

A production-ready Express + Prisma backend providing AI embedding APIs with user management, API key authentication, and token-based usage limits. Built with clean architecture for scalability and maintainability.

**Current Status:** ✅ Production ready with marketplace API, user authentication, and embedding services

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Server runs at: http://localhost:3000

---

## 🔧 Configuration

### Centralized API Key Limits

All API key limits are configured in one place: `src/config/api-key.config.ts`

**Environment Variables:**
```env
# Total tokens allowed per API key (default: 10000)
API_KEY_TOKEN_LIMIT_TOTAL=10000

# Maximum tokens per API call (default: 10)  
API_KEY_TOKEN_LIMIT_PER_CALL=10
```

**To change limits:**
1. **Via Environment**: Set variables in `.env` file
2. **Via Code**: Edit `src/config/api-key.config.ts` directly

### Other Configuration

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/coralbricks

# Server
PORT=3000
HOST=localhost

# Authentication
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# OpenAI (for mock embedding service)
OPENAI_API_KEY=your_openai_api_key_here

# Embedding Service
EMBEDDING_SERVICE_USE_MOCK=true
EMBEDDING_MOCK_TYPE=openai
```

---

## 📚 API Documentation

### Complete API Suite

**User Management APIs:**
- `POST /marketplace/v1/auth/register` - User registration
- `POST /marketplace/v1/auth/login` - User login
- `GET /marketplace/v1/user/profile` - Get user profile
- `POST /marketplace/v1/user/api-keys` - Create API key
- `GET /marketplace/v1/user/api-keys` - List user's API keys
- `GET /marketplace/v1/user/usage-stats` - Get usage statistics

**Embedding APIs:**
- `POST /api/v1/embed` - Generate text embeddings
- `POST /api/v1/count-tokens` - Count tokens in text
- `POST /api/v1/embed-commerce` - Generate product embeddings

**Health Check APIs:**
- `GET /` - Main API health check
- `GET /marketplace/health` - Marketplace API health
- `GET /api/health` - Embedding API health

### Authentication Flow

1. **Register User** → Get JWT token
2. **Create API Key** → Get API key with token limits  
3. **Use API Key** → Call embedding APIs (unlimited calls, token limits apply)

### Current Limits

- **API Calls**: Unlimited (tracked for analytics)
- **Total Tokens**: 10,000 per API key (configurable)
- **Per-Request Tokens**: 10 per call (configurable)
- **API Keys**: Unlimited per user

### Token Counting

- **Mock Mode**: Simple approximation (~4 characters = 1 token)
- **OpenAI Mode**: Actual OpenAI token count from API response
- **Production**: Will use client's model tokenizer

### Current Model

- **OpenAI `text-embedding-3-small`** (1536 dimensions)
- **Easily replaceable** when client deploys their own model
- **Mock service** for development/demo purposes

### API Response Format

All APIs return consistent JSON responses:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🏗️ Architecture

### Folder Structure

```
src/
├── config/              # Centralized configuration
│   ├── api-key.config.ts    # 🔧 API key limits (EDIT HERE)
│   ├── auth.config.ts       # JWT settings
│   ├── embedding.config.ts  # Model configuration
│   └── index.ts            # Main config export
├── domain/              # Business logic (DB-agnostic)
│   ├── user/           # User management
│   ├── api-key/        # API key management & validation
│   └── product/        # Product/shop management
├── persistence/         # Data access layer
│   └── postgres/       # Prisma repositories & mappers
├── api/                # HTTP endpoints
│   ├── marketplace/v1/ # User management APIs
│   ├── embedding/      # Main embedding APIs
│   └── middleware/     # Auth, validation, logging
├── integrations/       # External services
│   ├── embedding-service/ # OpenAI/client model integration
│   └── shopify/        # Shopify integration (legacy)
└── infrastructure/     # AWS services, logging
```

### Key Principles

1. **Centralized Configuration** - All limits in `src/config/api-key.config.ts`
2. **Clean Architecture** - Domain logic separate from infrastructure
3. **Token-Based Limits** - Industry-standard approach with provider tokenizers
4. **Unlimited API Calls** - Only token usage is limited and billed
5. **Easy Model Swapping** - Replace OpenAI with client's model seamlessly

---

## 🔑 API Key Management

### Limits Configuration

Edit `src/config/api-key.config.ts`:

```typescript
export const apiKeyConfig = {
  limits: {
    // Maximum tokens per API key (total)
    totalTokensPerKey: parseInt(process.env.API_KEY_TOKEN_LIMIT_TOTAL || '10000', 10),
    
    // Maximum tokens per API call
    tokensPerCall: parseInt(process.env.API_KEY_TOKEN_LIMIT_PER_CALL || '10', 10),
  },
  // ... other settings
}
```

### How Limits Work

1. **Per-Request Validation**: Text is estimated for token count before API call
2. **Total Token Tracking**: Actual tokens used are tracked and incremented
3. **Limit Enforcement**: Requests blocked when limits would be exceeded
4. **Multiple Keys**: Users can create unlimited API keys when limits are reached

---

## 🧪 Testing & Integration

See `test-apis.md` for complete frontend developer integration guide with:
- Step-by-step authentication flow
- Complete API examples with request/response
- Error handling patterns
- Token limit testing scenarios
- Production integration checklist

**Quick Health Check:**
```bash
curl http://localhost:3000/
```

**Quick User Registration:**
```bash
curl -X POST http://localhost:3000/marketplace/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","firstName":"Test","lastName":"User"}'
```

**Quick Embedding Test:**
```bash
# First get API key, then:
curl -X POST http://localhost:3000/api/v1/embed \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"text":"shoes","output_data_type":"float32","downstream_task":"query"}'
```

---

## 🔄 Model Integration

### Current Setup Options

**1. Mock Service (Development):**
```typescript
// src/config/embedding.config.ts
export const embeddingConfig = {
  useMock: true,
  mockType: 'openai', // or 'random'
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  }
}
```

**2. Client's Coral Service (Production):**
```typescript
// src/config/embedding.config.ts
export const embeddingConfig = {
  useMock: false,
  coral: {
    url: 'https://your-coral-service.com',
    model: 'coral_embed',
    dimensions: 1536,
  }
}
```

### Coral Service Integration

The client's custom embedding service uses OpenAI-compatible API format:

```javascript
// Query embeddings (for search queries)
response = client.embeddings.create({
  model: 'coral_embed',
  input: ['running shoes', 'nike sneakers'],
  extra_body: { task: 'query' }
})

// Product embeddings (for commerce data)
response = client.embeddings.create({
  model: 'coral_embed',
  input: [JSON.stringify(productObject)],
  extra_body: { task: 'product' }
})
```

**Key Features:**
- **Base64 Embeddings**: Returns base64-encoded vectors (automatically decoded)
- **Batch Processing**: Supports multiple inputs in single request
- **Task-Specific**: Different processing for 'query' vs 'product' tasks
- **Token Counting**: Accurate token usage tracking

### Switching to Production

1. **Update Environment Variables:**
```bash
# Switch to coral service
EMBEDDING_SERVICE_USE_MOCK=false
CORAL_EMBEDDING_SERVICE_URL=https://your-coral-service.com
CORAL_EMBEDDING_SERVICE_API_KEY=your_api_key_here
```

2. **Test Integration:**
```bash
node test-coral-integration.js
```

3. **No Code Changes Needed** - Architecture supports seamless swapping

---

## 📊 Usage Analytics

All API usage is tracked for analytics:

- **API call counts** (unlimited but tracked)
- **Token usage** (limited and tracked)
- **Request latency**
- **Success/failure rates**
- **User activity patterns**

Access via `/marketplace/v1/user/usage-stats` endpoint.

---

## 🚀 Deployment

### Environment Setup

1. Set production environment variables
2. Update `API_KEY_TOKEN_LIMIT_*` for production limits
3. Configure production database
4. Set secure `JWT_SECRET`
5. Configure client's embedding service URL

### Database Migrations

```bash
# Production migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## 🔧 Development

### Adding New Limits

1. **Edit Config**: Update `src/config/api-key.config.ts`
2. **Add Validation**: Update `api-key.service.ts` validation logic
3. **Update Tests**: Modify `test-apis.md` examples
4. **Environment**: Add new env vars to `.env.example`

### Adding New APIs

1. **Add Route**: `src/api/embedding/routes.ts`
2. **Add Controller**: `src/api/marketplace/v1/controllers/embedding.controller.ts`
3. **Add Validation**: Token limits and business logic
4. **Update Docs**: Add to `test-apis.md`

---

## 📈 Scaling Considerations

### Token Limits

- **Current**: Fixed limits for all users
- **Future**: User-specific limits, subscription tiers
- **Enterprise**: Custom limits per customer

### Model Integration

- **Current**: Coral embedding service with OpenAI-compatible API
- **Future**: Multiple model support, A/B testing between models
- **Enterprise**: Customer-specific model deployments and fine-tuning

### Infrastructure

- **Current**: Single server deployment
- **Future**: Load balancing, auto-scaling
- **Enterprise**: Multi-region deployment

---

## 🛠️ Troubleshooting

### Common Issues

**Token limits not working:**
- Check `src/config/api-key.config.ts` configuration
- Verify environment variables in `.env`
- Check database migration status

**API key creation fails:**
- Verify JWT token is valid
- Check database connection
- Review error logs for validation issues

**Embedding API errors:**
- Verify OpenAI API key (if using mock)
- Check token count estimation logic
- Review request payload format

### Debug Commands

```bash
# Check configuration
node -e "console.log(require('./src/config/api-key.config.ts').apiKeyConfig)"

# Test database connection
npx prisma db pull

# View logs
npm run dev | grep ERROR
```

---

## 📝 API Reference

For complete API documentation with examples, see `test-apis.md`.

**Key Endpoints:**
- `POST /marketplace/v1/auth/register` - User registration
- `POST /marketplace/v1/auth/login` - User login  
- `GET /marketplace/v1/user/profile` - Get user profile
- `POST /marketplace/v1/user/api-keys` - Create API key
- `GET /marketplace/v1/user/api-keys` - List API keys
- `GET /marketplace/v1/user/usage-stats` - Usage statistics
- `POST /api/v1/embed` - Text embedding
- `POST /api/v1/count-tokens` - Token counting
- `POST /api/v1/embed-commerce` - Product embedding

---

## 🤝 Contributing

1. **Configuration Changes**: Edit `src/config/api-key.config.ts`
2. **Business Logic**: Add to `src/domain/` services
3. **API Endpoints**: Add to `src/api/` controllers
4. **Database**: Create migrations with `npx prisma migrate dev`
5. **Documentation**: Update `test-apis.md` and README

### Code Style

- **TypeScript**: Strict mode enabled
- **Architecture**: Clean architecture principles
- **Testing**: Unit tests for services, integration tests for APIs
- **Documentation**: Keep `test-apis.md` updated for frontend integration

---

## 📞 Support

For questions about:
- **Configuration**: Check `src/config/api-key.config.ts`
- **API Integration**: See `test-apis.md`
- **Architecture**: Review folder structure above
- **Deployment**: Follow deployment section

**Frontend Integration**: Use `test-apis.md` as your integration guide.
