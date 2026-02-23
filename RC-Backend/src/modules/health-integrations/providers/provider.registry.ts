import { Injectable, Logger } from '@nestjs/common';
import { IHealthProvider } from './health-provider.interface';
import { IntegrationProvider } from '../schemas/health-integration.schema';

@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private providers = new Map<string, IHealthProvider>();

  register(provider: IHealthProvider): void {
    this.providers.set(provider.providerName, provider);
    this.logger.log(`Registered health provider: ${provider.providerName}`);
  }

  getProvider(name: string): IHealthProvider | null {
    return this.providers.get(name) || null;
  }

  getAvailableProviders(): IHealthProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  getAvailableProviderNames(): string[] {
    return this.getAvailableProviders().map((p) => p.providerName);
  }

  getAllProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(name: string): boolean {
    const provider = this.providers.get(name);
    return provider ? provider.isAvailable() : false;
  }
}
