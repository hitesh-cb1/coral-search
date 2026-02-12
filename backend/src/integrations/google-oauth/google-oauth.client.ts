import { OAuth2Client } from 'google-auth-library'
import { authConfig } from '../../config/auth.config'

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  email_verified: boolean
}

export class GoogleOAuthClient {
  private client: OAuth2Client

  constructor() {
    if (!authConfig.google.clientId) {
      throw new Error('Google Client ID is required for Google OAuth')
    }
    
    this.client = new OAuth2Client(
      authConfig.google.clientId,
      authConfig.google.clientSecret
    )
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: authConfig.google.clientId,
      })

      const payload = ticket.getPayload()
      if (!payload) {
        throw new Error('Invalid Google ID token payload')
      }

      // Validate required fields
      if (!payload.sub || !payload.email) {
        throw new Error('Google token missing required user information')
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        email_verified: payload.email_verified || false,
      }
    } catch (error) {
      throw new Error(`Google OAuth verification failed: ${(error as Error).message}`)
    }
  }

  /**
   * Generate Google OAuth URL for frontend redirect
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      redirect_uri: redirectUri,
      state: state,
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string, redirectUri: string) {
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: redirectUri,
      })

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google')
      }

      // Verify the ID token and get user info
      const userInfo = await this.verifyIdToken(tokens.id_token)

      return {
        userInfo,
        tokens,
      }
    } catch (error) {
      throw new Error(`Google OAuth token exchange failed: ${(error as Error).message}`)
    }
  }
}