// Cognito client utility
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  type AuthFlowType,
  type AttributeType
} from '@aws-sdk/client-cognito-identity-provider'
import * as jose from 'jose'

let cognitoClient: CognitoIdentityProviderClient | null = null

export function getCognitoClient(): CognitoIdentityProviderClient {
  if (cognitoClient) {
    return cognitoClient
  }

  const config = useRuntimeConfig()

  cognitoClient = new CognitoIdentityProviderClient({
    region: config.awsRegion || 'us-east-1'
  })

  return cognitoClient
}

export interface CognitoUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt?: string
  phone?: string
  profileImageUrl?: string
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}

// Helper to extract custom attributes from Cognito user attributes
function extractUserFromAttributes(attributes: AttributeType[], username: string): CognitoUser {
  const attrMap = new Map(attributes.map(attr => [attr.Name, attr.Value]))

  return {
    id: attrMap.get('sub') || username,
    email: attrMap.get('email') || '',
    firstName: attrMap.get('custom:first_name') || '',
    lastName: attrMap.get('custom:last_name') || '',
    role: attrMap.get('custom:role') || 'staff',
    isActive: attrMap.get('cognito:user_status') !== 'DISABLED',
    phone: attrMap.get('phone_number'),
    profileImageUrl: attrMap.get('custom:profile_image_url')
  }
}

export const cognitoService = {
  /**
   * Authenticate a user with email and password
   */
  async signIn(email: string, password: string): Promise<AuthTokens> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
      ClientId: config.cognitoClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: await computeSecretHash(email, config.cognitoClientId, config.cognitoClientSecret)
      }
    })

    const response = await client.send(command)

    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed')
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn!
    }
  },

  /**
   * Sign out a user globally (invalidate all tokens)
   */
  async signOut(accessToken: string): Promise<void> {
    const client = getCognitoClient()

    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    })

    await client.send(command)
  },

  /**
   * Get user information from access token
   */
  async getUser(accessToken: string): Promise<CognitoUser> {
    const client = getCognitoClient()

    const command = new GetUserCommand({
      AccessToken: accessToken
    })

    const response = await client.send(command)

    return extractUserFromAttributes(response.UserAttributes || [], response.Username!)
  },

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string): Promise<jose.JWTPayload> {
    const config = useRuntimeConfig()
    const issuerUrl = config.cognitoIssuerUrl

    // Fetch JWKS from Cognito
    const JWKS = jose.createRemoteJWKSet(
      new URL(`${issuerUrl}/.well-known/jwks.json`)
    )

    // Cognito access tokens don't have an 'aud' claim (only ID tokens do),
    // so we verify issuer only and check client_id manually if needed
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: issuerUrl
    })

    return payload
  },

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string, email: string): Promise<AuthTokens> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH' as AuthFlowType,
      ClientId: config.cognitoClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: await computeSecretHash(email, config.cognitoClientId, config.cognitoClientSecret)
      }
    })

    const response = await client.send(command)

    if (!response.AuthenticationResult) {
      throw new Error('Token refresh failed')
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: refreshToken, // Refresh token doesn't change
      expiresIn: response.AuthenticationResult.ExpiresIn!
    }
  },

  // Admin operations (require service role)

  /**
   * Create a new user (admin)
   */
  async adminCreateUser(params: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
    phone?: string
  }): Promise<CognitoUser> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const userAttributes: AttributeType[] = [
      { Name: 'email', Value: params.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:first_name', Value: params.firstName },
      { Name: 'custom:last_name', Value: params.lastName },
      { Name: 'custom:role', Value: params.role }
    ]

    if (params.phone) {
      userAttributes.push({ Name: 'phone_number', Value: params.phone })
    }

    const createCommand = new AdminCreateUserCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: params.email,
      UserAttributes: userAttributes,
      MessageAction: 'SUPPRESS' // Don't send welcome email
    })

    await client.send(createCommand)

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: params.email,
      Password: params.password,
      Permanent: true
    })

    await client.send(setPasswordCommand)

    // Get and return the created user
    return this.adminGetUser(params.email)
  },

  /**
   * Get user by username/email (admin)
   */
  async adminGetUser(username: string): Promise<CognitoUser> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new AdminGetUserCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: username
    })

    const response = await client.send(command)

    const user = extractUserFromAttributes(response.UserAttributes || [], response.Username!)
    user.isActive = response.Enabled !== false
    user.createdAt = response.UserCreateDate?.toISOString()

    return user
  },

  /**
   * Update user attributes (admin)
   */
  async adminUpdateUser(username: string, attributes: {
    firstName?: string
    lastName?: string
    role?: string
    phone?: string
    profileImageUrl?: string
  }): Promise<CognitoUser> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const userAttributes: AttributeType[] = []

    if (attributes.firstName !== undefined) {
      userAttributes.push({ Name: 'custom:first_name', Value: attributes.firstName })
    }
    if (attributes.lastName !== undefined) {
      userAttributes.push({ Name: 'custom:last_name', Value: attributes.lastName })
    }
    if (attributes.role !== undefined) {
      userAttributes.push({ Name: 'custom:role', Value: attributes.role })
    }
    if (attributes.phone !== undefined) {
      userAttributes.push({ Name: 'phone_number', Value: attributes.phone })
    }
    if (attributes.profileImageUrl !== undefined) {
      userAttributes.push({ Name: 'custom:profile_image_url', Value: attributes.profileImageUrl })
    }

    if (userAttributes.length > 0) {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: config.cognitoUserPoolId,
        Username: username,
        UserAttributes: userAttributes
      })

      await client.send(command)
    }

    return this.adminGetUser(username)
  },

  /**
   * Delete a user (admin)
   */
  async adminDeleteUser(username: string): Promise<void> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new AdminDeleteUserCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: username
    })

    await client.send(command)
  },

  /**
   * Disable a user (admin)
   */
  async adminDisableUser(username: string): Promise<void> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new AdminDisableUserCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: username
    })

    await client.send(command)
  },

  /**
   * Enable a user (admin)
   */
  async adminEnableUser(username: string): Promise<void> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new AdminEnableUserCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: username
    })

    await client.send(command)
  },

  /**
   * List all users (admin)
   */
  async adminListUsers(params?: {
    limit?: number
    paginationToken?: string
    filter?: string
  }): Promise<{ users: CognitoUser[]; paginationToken?: string }> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new ListUsersCommand({
      UserPoolId: config.cognitoUserPoolId,
      Limit: params?.limit || 60,
      PaginationToken: params?.paginationToken,
      Filter: params?.filter
    })

    const response = await client.send(command)

    const users = (response.Users || []).map(user => {
      const cognitoUser = extractUserFromAttributes(user.Attributes || [], user.Username!)
      cognitoUser.isActive = user.Enabled !== false
      cognitoUser.createdAt = user.UserCreateDate?.toISOString()
      return cognitoUser
    })

    return {
      users,
      paginationToken: response.PaginationToken
    }
  },

  /**
   * Reset user password (admin)
   */
  async adminSetPassword(username: string, newPassword: string): Promise<void> {
    const config = useRuntimeConfig()
    const client = getCognitoClient()

    const command = new AdminSetUserPasswordCommand({
      UserPoolId: config.cognitoUserPoolId,
      Username: username,
      Password: newPassword,
      Permanent: true
    })

    await client.send(command)
  }
}

// Helper function to compute secret hash for Cognito
async function computeSecretHash(
  username: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(username + clientId)
  )

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}
