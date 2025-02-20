// types/auth.ts

/**
 * Represents the minimal user data.
 * You can expand this interface to include additional user properties as needed.
 */
export interface User {
  id: string;
  email: string;
  // Optionally include metadata, such as a role or other profile information.
  user_metadata?: Record<string, any>;
}

/**
 * Represents the authentication state for your application.
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Represents the credentials required to sign in.
 */
export interface UserCredentials {
  email: string;
  password: string;
}
