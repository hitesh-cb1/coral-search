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

      const { text, product_offering, output_data_type, task } = req.body

      // Determine task type - use 'task' parameter or infer from input
      let taskType: 'query' | 'product' = task
      if (!taskType) {
        // Infer from input: if product_offering exists, it's product; otherwise query
        taskType = product_offering ? 'product' : 'query'
      }

      // Validate task
      const validTasks = ['query', 'product']
      if (!validTasks.includes(taskType)) {
        res.status(400).json({ 
          success: false, 
          error: `Invalid task. Must be one of: ${validTasks.join(', ')}` 
        })
        return
      }

      // Validate input based on task type
      if (taskType === 'query') {
        if (!text || typeof text !== 'string') {
          res.status(400).json({ 
            success: false, 
            error: 'Text input is required and must be a string for query task' 
          })
          return
        }
      } else {
        // Product task
        if (!product_offering || typeof product_offering !== 'object') {
          res.status(400).json({ 
            success: false, 
            error: 'Product offering is required and must be an object for product task' 
          })
          return
        }

        if (!product_offering.title) {
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

      // Estimate token usage before making the call
      let estimatedTokens: number
      let inputSize: number
      if (taskType === 'query') {
        estimatedTokens = Math.ceil(text.length / 4)
        inputSize = text.length
      } else {
        const productText = JSON.stringify(product_offering)
        estimatedTokens = Math.ceil(productText.length / 4)
        inputSize = productText.length
      }
      
      // API key already validated in middleware - no need to validate again
      // Validate account-level token balance (must happen before embedding call)
      await this.userService.validateTokenBalance(req.apiKey!.userId, estimatedTokens)

      // Call appropriate embedding service based on task type
      let result
      if (taskType === 'query') {
        result = await this.embeddingClient.embed({
          text,
          output_data_type: finalOutputDataType,
          downstream_task: taskType,
        })
      } else {
        result = await this.embeddingClient.embedCommerce({
          product_offering,
          output_data_type: finalOutputDataType,
          downstream_task: taskType,
        })
      }

      const latency = Date.now() - startTime

      // Transform embeddings (fast operation)
      const transformedData = result.embeddings.map((embedding, index) => ({
        object: 'embedding' as const,
        embedding,
        index,
      }))

      // Check if client requested latency in headers
      const shouldReturnLatencyInHeader = req.headers['x-get-latency'] === 'true'

      // Prepare response
      const responseData: Record<string, unknown> = {
        object: 'list',
        data: transformedData,
        model: result.model,
        usage: {
          prompt_tokens: result.usage.tokens,
          total_tokens: result.usage.tokens,
        },
      }

      // Only include latency_ms in body if header was not requested (backward compatibility)
      // If header was requested, latency will be in response headers instead
      if (!shouldReturnLatencyInHeader) {
        responseData.latency_ms = latency
      }

      // Set latency in response header if requested
      if (shouldReturnLatencyInHeader) {
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
      
      // Log failed usage asynchronously (don't block error response)
      if (req.apiKey) {
        const inputSize = req.body?.text?.length || 
          (req.body?.product_offering ? JSON.stringify(req.body.product_offering).length : 0)
        
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