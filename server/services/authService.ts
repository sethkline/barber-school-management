// Auth service using AWS Cognito
import { cognitoService } from '~/server/utils/cognitoClient'

export const authService = {
  /**
   * Authenticate a user with email and password
   */
  async login({ email, password }: { email: string; password: string }) {
    const tokens = await cognitoService.signIn(email, password)
    const user = await cognitoService.getUser(tokens.accessToken)

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    }
  },

  /**
   * Sign out a user globally (invalidate all tokens)
   */
  async logout(accessToken: string) {
    await cognitoService.signOut(accessToken)
  },

  /**
   * Refresh tokens using a refresh token
   */
  async refreshTokens(refreshToken: string, email: string) {
    return cognitoService.refreshTokens(refreshToken, email)
  },

  /**
   * Verify an access token
   */
  async verifyToken(accessToken: string) {
    return cognitoService.verifyToken(accessToken)
  },

  /**
   * Get user information from an access token
   */
  async getUser(accessToken: string) {
    return cognitoService.getUser(accessToken)
  },

  /**
   * Reset a user's password (admin operation)
   */
  async resetPassword(username: string, newPassword: string) {
    await cognitoService.adminSetPassword(username, newPassword)
    return true
  }
}
