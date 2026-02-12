# Frontend Developer Integration Guide
## CoralBricks AI Embedding API Service

This guide provides everything you need to integrate the CoralBricks embedding APIs into your frontend application.

---

## 🚀 Quick Start

**Base URL:** `http://localhost:3000` (development) | `https://your-domain.com` (production)

**Authentication:** JWT tokens for user management, API keys for embedding services

**Rate Limits:** Unlimited API calls, token-based usage limits (10,000 tokens per API key, 10 tokens per request)

---

## 📋 Integration Checklist

- [ ] User registration/login flow
- [ ] API key creation and management
- [ ] Embedding API integration
- [ ] Error handling implementation
- [ ] Token limit monitoring
- [ ] Usage analytics integration

---

## 🔐 Authentication Flow

### Step 1: User Registration

**Endpoint:** `POST /marketplace/v1/auth/register`

**Request:**
```javascript
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
  });
  
  return await response.json();
};
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2024-01-20T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Email already exists",
  "code": "EMAIL_EXISTS"
}
```

### Step 2: User Login

**Endpoint:** `POST /marketplace/v1/auth/login`

**Request:**
```javascript
const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });
  
  return await response.json();
};
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### Step 3: Get User Profile

**Endpoint:** `GET /marketplace/v1/user/profile`

**Request:**
```javascript
const getUserProfile = async (jwtToken) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/user/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-20T10:00:00Z",
    "apiKeyCount": 2,
    "totalTokensUsed": 1250
  }
}
```

---

## 🔑 API Key Management

### Create API Key

**Endpoint:** `POST /marketplace/v1/user/api-keys`

**Request:**
```javascript
const createApiKey = async (jwtToken, keyName) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/user/api-keys', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: keyName
    })
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "key_123",
    "key": "ak_1234567890abcdef1234567890abcdef",
    "name": "My Frontend App Key",
    "tokenLimit": 10000,
    "tokenUsed": 0,
    "usageCount": 0,
    "isActive": true,
    "createdAt": "2024-01-20T10:00:00Z"
  },
  "message": "API key created successfully. Token limit: 10,000 tokens, 10 tokens per call."
}
```

### List API Keys

**Endpoint:** `GET /marketplace/v1/user/api-keys`

**Request:**
```javascript
const getApiKeys = async (jwtToken) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/user/api-keys', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key_123",
      "name": "My Frontend App Key",
      "tokenLimit": 10000,
      "tokenUsed": 1250,
      "usageCount": 125,
      "isActive": true,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

## 🤖 Embedding APIs

### 1. Text Embedding

**Endpoint:** `POST /api/v1/embed`

**Purpose:** Generate vector embeddings for text input

**Request:**
```javascript
const generateEmbedding = async (apiKey, text, options = {}) => {
  const response = await fetch('http://localhost:3000/api/v1/embed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      output_data_type: options.outputDataType || 'float32',
      downstream_task: options.downstreamTask || 'search'
    })
  });
  
  return await response.json();
};
```

**Request Parameters:**
- `text` (required): Text to embed (max 10 tokens per request)
- `output_data_type` (optional): "float32" or "int8" (default: "float32")
- `downstream_task` (optional): "search", "classification", "clustering" (default: "search")

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "embedding": [0.1234, -0.5678, 0.9012, ...], // 1536 dimensions
    "tokensUsed": 3,
    "model": "text-embedding-3-small",
    "dimensions": 1536
  },
  "message": "Embedding generated successfully"
}
```

**Usage Example:**
```javascript
// Simple text embedding
const result = await generateEmbedding('ak_your_api_key', 'running shoes');

// With options
const result = await generateEmbedding('ak_your_api_key', 'product search', {
  outputDataType: 'float32',
  downstreamTask: 'search'
});
```

### 2. Token Counting

**Endpoint:** `POST /api/v1/count-tokens`

**Purpose:** Count tokens in text before making embedding requests

**Request:**
```javascript
const countTokens = async (apiKey, text) => {
  const response = await fetch('http://localhost:3000/api/v1/count-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text
    })
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenCount": 3,
    "text": "running shoes",
    "model": "text-embedding-3-small"
  },
  "message": "Token count calculated"
}
```

**Usage Example:**
```javascript
// Check token count before embedding
const tokenResult = await countTokens('ak_your_api_key', 'comfortable running shoes');
if (tokenResult.data.tokenCount <= 10) {
  const embedding = await generateEmbedding('ak_your_api_key', 'comfortable running shoes');
}
```

### 3. Commerce/Product Embedding

**Endpoint:** `POST /api/v1/embed-commerce`

**Purpose:** Generate embeddings for product/commerce data with structured input

**Request:**
```javascript
const generateCommerceEmbedding = async (apiKey, productData, options = {}) => {
  const response = await fetch('http://localhost:3000/api/v1/embed-commerce', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_offering: productData,
      output_data_type: options.outputDataType || 'float32',
      downstream_task: options.downstreamTask || 'search'
    })
  });
  
  return await response.json();
};
```

**Request Parameters:**
- `product_offering` (required): Product object with structured data
- `output_data_type` (optional): "float32" or "int8"
- `downstream_task` (optional): "search", "classification", "clustering"

**Product Object Structure:**
```javascript
const productData = {
  title: "Nike Air Max 270",
  description: "Comfortable running shoes with air cushioning",
  price: 129.99,
  category: "Footwear",
  brand: "Nike",
  // Optional fields:
  sku: "AM270-001",
  tags: ["running", "sports", "comfortable"],
  availability: "in_stock"
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "embedding": [0.1234, -0.5678, 0.9012, ...],
    "tokensUsed": 8,
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "productSummary": "Nike Air Max 270 - Comfortable running shoes with air cushioning - $129.99"
  },
  "message": "Commerce embedding generated successfully"
}
```

**Usage Example:**
```javascript
const product = {
  title: "Nike Air Max 270",
  description: "Comfortable running shoes",
  price: 129.99,
  category: "Footwear",
  brand: "Nike"
};

const result = await generateCommerceEmbedding('ak_your_api_key', product);
```

---

## 📊 Usage Analytics

### Get Usage Statistics

**Endpoint:** `GET /marketplace/v1/user/usage-stats`

**Request:**
```javascript
const getUsageStats = async (jwtToken) => {
  const response = await fetch('http://localhost:3000/marketplace/v1/user/usage-stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalApiKeys": 2,
    "totalTokensUsed": 1250,
    "totalApiCalls": 125,
    "apiKeys": [
      {
        "id": "key_123",
        "name": "Frontend App",
        "tokenUsed": 750,
        "tokenLimit": 10000,
        "usageCount": 75,
        "utilizationPercent": 7.5
      },
      {
        "id": "key_456",
        "name": "Mobile App",
        "tokenUsed": 500,
        "tokenLimit": 10000,
        "usageCount": 50,
        "utilizationPercent": 5.0
      }
    ]
  }
}
```

---

## ⚠️ Error Handling

### Common Error Responses

**Token Limit Exceeded (Per Request):**
```json
{
  "success": false,
  "error": "Request exceeds maximum token limit of 10 tokens per call",
  "code": "TOKEN_LIMIT_PER_CALL_EXCEEDED"
}
```

**Total Token Limit Exceeded:**
```json
{
  "success": false,
  "error": "API key token limit exceeded",
  "code": "TOKEN_LIMIT_EXCEEDED"
}
```

**Invalid API Key:**
```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

**Expired JWT Token:**
```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

### Error Handling Implementation

```javascript
const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!data.success) {
    switch (data.code) {
      case 'TOKEN_LIMIT_EXCEEDED':
        // Prompt user to create new API key
        showCreateApiKeyDialog();
        break;
      case 'TOKEN_LIMIT_PER_CALL_EXCEEDED':
        // Show error about text being too long
        showTextTooLongError();
        break;
      case 'INVALID_API_KEY':
        // Redirect to API key management
        redirectToApiKeyManagement();
        break;
      case 'TOKEN_EXPIRED':
        // Redirect to login
        redirectToLogin();
        break;
      default:
        showGenericError(data.error);
    }
    throw new Error(data.error);
  }
  
  return data;
};
```

---

## 🔧 Token Management

### Token Limits

- **Total Tokens per API Key:** 10,000 (configurable)
- **Tokens per Request:** 10 maximum (configurable)
- **Token Estimation:** ~4 characters = 1 token (approximate)

### Token Validation Examples

**Valid Requests (≤10 tokens):**
```javascript
// 1 token
await generateEmbedding(apiKey, "shoes");

// 3 tokens  
await generateEmbedding(apiKey, "running shoes Nike");

// 5 tokens
await generateEmbedding(apiKey, "comfortable athletic footwear brand");
```

**Invalid Requests (>10 tokens):**
```javascript
// ~14 tokens - will be rejected
await generateEmbedding(apiKey, "very comfortable and lightweight running shoes perfect for marathon training sessions");
```

### Pre-Request Token Validation

```javascript
const safeEmbedding = async (apiKey, text) => {
  // Check token count first
  const tokenCheck = await countTokens(apiKey, text);
  
  if (tokenCheck.data.tokenCount > 10) {
    throw new Error(`Text too long: ${tokenCheck.data.tokenCount} tokens (max 10)`);
  }
  
  // Proceed with embedding
  return await generateEmbedding(apiKey, text);
};
```

---

## 🚀 Production Integration

### Environment Configuration

```javascript
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000
  },
  production: {
    baseUrl: 'https://api.coralbricks.com',
    timeout: 10000
  }
};

const getApiUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? API_CONFIG.production.baseUrl 
    : API_CONFIG.development.baseUrl;
};
```

### API Client Implementation

```javascript
class CoralBricksClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || getApiUrl();
    this.timeout = options.timeout || 10000;
    this.jwtToken = null;
    this.apiKey = null;
  }

  async setJwtToken(token) {
    this.jwtToken = token;
  }

  async setApiKey(key) {
    this.apiKey = key;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add authentication
    if (options.useApiKey && this.apiKey) {
      config.headers.Authorization = `Bearer ${this.apiKey}`;
    } else if (this.jwtToken) {
      config.headers.Authorization = `Bearer ${this.jwtToken}`;
    }

    const response = await fetch(url, config);
    return await handleApiResponse(response);
  }

  // User management
  async register(userData) {
    return this.request('/marketplace/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.request('/marketplace/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async getProfile() {
    return this.request('/marketplace/v1/user/profile');
  }

  async createApiKey(name) {
    return this.request('/marketplace/v1/user/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async getApiKeys() {
    return this.request('/marketplace/v1/user/api-keys');
  }

  async getUsageStats() {
    return this.request('/marketplace/v1/user/usage-stats');
  }

  // Embedding APIs
  async embed(text, options = {}) {
    return this.request('/api/v1/embed', {
      method: 'POST',
      useApiKey: true,
      body: JSON.stringify({
        text,
        output_data_type: options.outputDataType || 'float32',
        downstream_task: options.downstreamTask || 'search'
      })
    });
  }

  async countTokens(text) {
    return this.request('/api/v1/count-tokens', {
      method: 'POST',
      useApiKey: true,
      body: JSON.stringify({ text })
    });
  }

  async embedCommerce(productData, options = {}) {
    return this.request('/api/v1/embed-commerce', {
      method: 'POST',
      useApiKey: true,
      body: JSON.stringify({
        product_offering: productData,
        output_data_type: options.outputDataType || 'float32',
        downstream_task: options.downstreamTask || 'search'
      })
    });
  }
}
```

### Usage Example

```javascript
// Initialize client
const client = new CoralBricksClient();

// User registration and login
const registerResult = await client.register({
  email: 'user@example.com',
  password: 'SecurePass123',
  firstName: 'John',
  lastName: 'Doe'
});

client.setJwtToken(registerResult.data.token);

// Create API key
const apiKeyResult = await client.createApiKey('My App Key');
client.setApiKey(apiKeyResult.data.key);

// Generate embeddings
const embedding = await client.embed('running shoes');
const commerceEmbedding = await client.embedCommerce({
  title: 'Nike Air Max',
  description: 'Comfortable running shoes',
  price: 129.99,
  category: 'Footwear',
  brand: 'Nike'
});
```

---

## 🔍 Testing Scenarios

### 1. Complete User Flow Test

```javascript
const testCompleteFlow = async () => {
  const client = new CoralBricksClient();
  
  // 1. Register user
  const user = await client.register({
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123',
    firstName: 'Test',
    lastName: 'User'
  });
  
  client.setJwtToken(user.data.token);
  
  // 2. Create API key
  const apiKey = await client.createApiKey('Test Key');
  client.setApiKey(apiKey.data.key);
  
  // 3. Test embeddings
  const textEmbedding = await client.embed('test text');
  const tokenCount = await client.countTokens('test text');
  const commerceEmbedding = await client.embedCommerce({
    title: 'Test Product',
    description: 'Test description',
    price: 99.99,
    category: 'Test',
    brand: 'Test Brand'
  });
  
  // 4. Check usage
  const usage = await client.getUsageStats();
  
  console.log('All tests passed!', { textEmbedding, tokenCount, commerceEmbedding, usage });
};
```

### 2. Token Limit Testing

```javascript
const testTokenLimits = async (client) => {
  // Test per-request limit (should fail)
  try {
    await client.embed('this is a very long text that should exceed the ten token limit per request and cause an error');
  } catch (error) {
    console.log('Per-request limit test passed:', error.message);
  }
  
  // Test total limit (make many requests)
  let totalTokens = 0;
  while (totalTokens < 10000) {
    try {
      const result = await client.embed('short text');
      totalTokens += result.data.tokensUsed;
      console.log(`Used ${totalTokens} tokens so far`);
    } catch (error) {
      console.log('Total limit reached:', error.message);
      break;
    }
  }
};
```

---

## 📋 Integration Checklist

### Frontend Implementation

- [ ] **User Authentication**
  - [ ] Registration form with validation
  - [ ] Login form with error handling
  - [ ] JWT token storage and management
  - [ ] Auto-logout on token expiration

- [ ] **API Key Management**
  - [ ] API key creation interface
  - [ ] API key listing with usage stats
  - [ ] API key selection for embedding requests
  - [ ] New key creation when limits reached

- [ ] **Embedding Interface**
  - [ ] Text input with token count preview
  - [ ] Real-time token validation
  - [ ] Embedding result display
  - [ ] Error handling and user feedback

- [ ] **Usage Monitoring**
  - [ ] Usage statistics dashboard
  - [ ] Token usage visualization
  - [ ] Limit warnings and notifications
  - [ ] Usage history tracking

### Error Handling

- [ ] **Network Errors**
  - [ ] Connection timeout handling
  - [ ] Retry logic for failed requests
  - [ ] Offline state management

- [ ] **API Errors**
  - [ ] Token limit exceeded handling
  - [ ] Invalid API key handling
  - [ ] Authentication error handling
  - [ ] Validation error display

### Performance

- [ ] **Request Optimization**
  - [ ] Request debouncing for real-time features
  - [ ] Batch token counting
  - [ ] Response caching where appropriate

- [ ] **User Experience**
  - [ ] Loading states for all API calls
  - [ ] Progress indicators for long operations
  - [ ] Responsive design for all screen sizes

---

## 🆘 Support & Troubleshooting

### Common Issues

**"Invalid API key" errors:**
- Verify API key format starts with `ak_`
- Check if API key is active
- Ensure correct Authorization header format

**Token limit errors:**
- Use `count-tokens` endpoint to check before embedding
- Create new API keys when limits are reached
- Monitor usage with statistics endpoint

**Authentication errors:**
- Check JWT token expiration
- Verify token format in Authorization header
- Re-authenticate if token is expired

### Debug Mode

```javascript
const client = new CoralBricksClient({ 
  debug: true,
  baseUrl: 'http://localhost:3000'
});

// Enable request/response logging
client.enableDebug();
```

### Health Checks

```javascript
const checkApiHealth = async () => {
  const endpoints = [
    '/',
    '/marketplace/health',
    '/api/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`${endpoint}: ${response.status}`);
    } catch (error) {
      console.error(`${endpoint}: ERROR`, error.message);
    }
  }
};
```

---

**Need Help?** 
- Check the main README.md for architecture details
- Review error codes in responses for specific issues
- Test with curl commands first to isolate frontend vs API issues
- Monitor network tab in browser dev tools for request/response details