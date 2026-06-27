export type AuthProvider = "credentials" | "google";

export interface AuthUser {
  id: string;
  email: string;
  type: "user";
  emailVerified?: boolean;
  authProvider?: AuthProvider;
  profileComplete?: boolean;
  preferredLanguage?: string;
  hasPassword?: boolean;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  type: "user";
  v?: number;
  iat?: number;
  exp?: number;
}

export interface GoogleProfileInput {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  preferredLanguage?: string;
}
