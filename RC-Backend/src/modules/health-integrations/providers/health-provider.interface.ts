import { HealthIntegrationDocument } from '../schemas/health-integration.schema';

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface RawHealthData {
  dataType: string;
  value: {
    primary?: number;
    secondary?: number;
    unit?: string;
    details?: Record<string, any>;
  };
  recordedAt: Date;
  metadata?: {
    externalId?: string;
    deviceType?: string;
    deviceModel?: string;
  };
}

export interface IHealthProvider {
  readonly providerName: string;

  /**
   * Generate an OAuth authorization URL for the user.
   * Returns null for push-based providers (e.g. Apple Health).
   */
  getAuthUrl(userId: string, state: string): Promise<string | null>;

  /**
   * Exchange an authorization code for access/refresh tokens.
   */
  exchangeToken(code: string): Promise<TokenResult>;

  /**
   * Refresh an expired access token using the stored refresh token.
   */
  refreshToken(integration: HealthIntegrationDocument): Promise<TokenResult>;

  /**
   * Fetch health data from the provider API.
   */
  fetchHealthData(
    integration: HealthIntegrationDocument,
    dataTypes: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<RawHealthData[]>;

  /**
   * Revoke access and clean up provider-side resources.
   */
  revokeAccess(integration: HealthIntegrationDocument): Promise<void>;

  /**
   * Whether this provider supports incoming webhooks for real-time data.
   */
  supportsWebhook(): boolean;

  /**
   * Whether this provider is currently available (env vars configured, service reachable).
   */
  isAvailable(): boolean;
}
