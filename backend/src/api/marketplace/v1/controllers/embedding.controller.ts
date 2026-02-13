import { Request, Response } from 'express'
import { EmbeddingClient } from '../../../../integrations/embedding-service/embedding.client'
import { ApiKeyService } from '../../../../domain/api-key/api-key.service'
import { UserService } from '../../../../domain/user/user.service'
import { ValidationError } from '../../../../shared/errors/app-error'

interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
  }
  apiKey?: {
    id: number
    userId: number
  }
}

export class EmbeddingController {
  constructor(
    private readonly embeddingClient: EmbeddingClient,
    private readonly apiKeyService: ApiKeyService,
    private readonly userService: UserService
  ) {}

  embeddings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now()
    
    try {
      if (!req.apiKey) {
        res.status(401).json({ 
          success: false, 
          error: 'API key authentication required' 
        })
        return
      }

      const { text, product_offering, input: inputArray, output_data_type, task } = req.body

      // Support OpenAI-style body: input (array of strings), model, task
      let resolvedText: string | undefined
      let resolvedProductOffering: Record<string, unknown> | undefined
      let taskType: 'query' | 'product' = task

      if (Array.isArray(inputArray) && inputArray.length > 0) {
        // New format: input array + task
        if (!taskType) taskType = 'query'
        if (taskType === 'query') {
          resolvedText = typeof inputArray[0] === 'string' ? inputArray[0] : String(inputArray[0])
        } else {
          try {
            const parsed = typeof inputArray[0] === 'string' ? JSON.parse(inputArray[0]) : inputArray[0]
            if (parsed && typeof parsed === 'object' && parsed.title) {
              resolvedProductOffering = parsed
            }
          } catch {
            // ignore
          }
        }
      } else {
        // Legacy format: text or product_offering
        if (!taskType) taskType = product_offering ? 'product' : 'query'
        if (taskType === 'query') resolvedText = text
        else resolvedProductOffering = product_offering
      }

      const validTasks = ['query', 'product']
      if (!validTasks.includes(taskType)) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid task. Must be one of: ${validTasks.join(', ')}` 
        })
        return
      }

      if (taskType === 'query') {
        if (!resolvedText || typeof resolvedText !== 'string') {
          res.status(400).json({ 
            success: false, 
            error: 'Text input is required. Use "input": ["your text"] for query task.' 
          })
          return
        }
      } else {
        if (!resolvedProductOffering || typeof resolvedProductOffering !== 'object') {
          res.status(400).json({ 
            success: false, 
            error: 'Product offering is required. Use "input": [{"title":"..."}] for product task.' 
          })
          return
        }
        if (!resolvedProductOffering.title) {
          res.status(400).json({ 
            success: false, 
            error: 'Product title is required' 
          })
          return
        }
      }

      // Validate output_data_type if provided - only support float32
      const validOutputDataTypes = ['float32']
      if (output_data_type && !validOutputDataTypes.includes(output_data_type)) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid output_data_type. Only 'float32' is supported.` 
        })
        return
      }

      // Default to float32 if not provided
      const finalOutputDataType = output_data_type || 'float32'

      const textForQuery = resolvedText!
      const productForCommerce = resolvedProductOffering!

      let estimatedTokens: number
      let inputSize: number
      if (taskType === 'query') {
        estimatedTokens = Math.ceil(textForQuery.length / 4)
        inputSize = textForQuery.length
      } else {
        const productText = JSON.stringify(productForCommerce)
        estimatedTokens = Math.ceil(productText.length / 4)
        inputSize = productText.length
      }
      
      // API key already validated in middleware - no need to validate again
      // Validate account-level token balance (must happen before embedding call)
      await this.userService.validateTokenBalance(req.apiKey!.userId, estimatedTokens)

      let result
      if (taskType === 'query') {
        result = await this.embeddingClient.embed({
          text: textForQuery,
          output_data_type: finalOutputDataType,
          downstream_task: taskType,
        })
      } else {
        result = await this.embeddingClient.embedCommerce({
          product_offering: productForCommerce,
          output_data_type: finalOutputDataType,
          downstream_task: taskType,
        })
      }

      const latency = Date.now() - startTime

      // OpenAI-style response: data array with index and embedding (no object fields)
      const transformedData = result.embeddings.map((embedding, index) => ({
        index,
        embedding,
      }))

      const useDebugHeader = req.headers['x-debug'] === 'true' || req.headers['x-get-latency'] === 'true'

      const responseData: Record<string, unknown> = {
        data: transformedData,
        model: result.model,
        usage: {
          prompt_tokens: result.usage.tokens,
          total_tokens: result.usage.tokens,
        },
      }

      if (useDebugHeader) {
        res.setHeader('X-Debug-Info', JSON.stringify({ latency_ms: Math.round(latency * 100) / 100 }))
      } else {
        res.setHeader('X-latency-ms', latency.toString())
      }

      // Send response immediately (don't wait for async operations)
      res.json(responseData)

      // Perform async operations after response is sent (fire-and-forget)
      // This includes token deduction and usage logging
      Promise.all([
        // Deduct tokens from account balance (use actual tokens from response)
        this.userService.deductTokens(req.apiKey!.userId, result.usage.tokens),
        // Log usage (async - don't block response)
        this.apiKeyService.logUsage({
          userId: req.apiKey!.userId,
          apiKeyId: req.apiKey!.id,
          endpoint: '/api/v1/embeddings',
          method: 'POST',
          tokensUsed: result.usage.tokens,
          latencyMs: latency,
          inputSize,
          outputSize: JSON.stringify(result.embeddings).length,
          success: true,
        }).catch(err => {
          // Log errors but don't fail the request
          console.error('Failed to log usage:', err)
        })
      ]).catch(err => {
        // Log errors but don't fail the request
        console.error('Failed to complete async operations:', err)
      })
    } catch (error) {
      const latency = Date.now() - startTime
      
      // Check if client requested latency in headers
      const shouldReturnLatencyInHeader = req.headers['x-get-latency'] === 'true'
      
      // Set latency in response header if requested (even for errors)
      if (shouldReturnLatencyInHeader) {
        res.setHeader('X-latency-ms', latency.toString())
      }
      
      if (req.apiKey) {
        const body = req.body || {}
        const firstInput = Array.isArray(body.input) ? body.input[0] : undefined
        const inputSize = body.text?.length ??
          (typeof firstInput === 'string' ? firstInput.length : firstInput ? JSON.stringify(firstInput).length : 0) ??
          (body.product_offering ? JSON.stringify(body.product_offering).length : 0)
        
        this.apiKeyService.logUsage({
          userId: req.apiKey.userId,
          apiKeyId: req.apiKey.id,
          endpoint: '/api/v1/embeddings',
          method: 'POST',
          tokensUsed: 0,
          latencyMs: latency,
          inputSize,
          success: false,
          errorCode: error instanceof Error ? error.constructor.name : 'UnknownError',
        }).catch(err => {
          console.error('Failed to log error usage:', err)
        })
      }

      if (error instanceof ValidationError) {
        res.status(400).json({ 
          success: false, 
          error: error.message 
        })
      } else {
        console.error('Embedding service error:', error)
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown embedding service error' 
        })
      }
    }
  }

}