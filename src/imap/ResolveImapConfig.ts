import type { ImapConfig } from '../types'
import { findAddressOverride } from './FindAddressOverride'
import { findProviderDefault } from './FindProviderDefault'
import { deriveProvider } from './DeriveProvider'
import { toImapConfig } from './mappers'

class ResolveImapConfig {
  async execute(tenantId: string, emailAddress: string, providerOverride?: string | null): Promise<ImapConfig | null> {
    const override = await findAddressOverride.execute(tenantId, emailAddress)
    if (override) return toImapConfig(override)

    // Explicit provider set at registration time — skip domain derivation
    if (providerOverride) {
      const explicitConfig = await findProviderDefault.execute(tenantId, providerOverride as any)
      if (explicitConfig) return toImapConfig(explicitConfig)
    }

    // Auto-derive provider from email domain (gmail.com → gmail)
    const provider = deriveProvider.execute(emailAddress)
    if (provider) {
      const defaultConfig = await findProviderDefault.execute(tenantId, provider)
      if (defaultConfig) return toImapConfig(defaultConfig)
    }

    return null
  }
}

export const resolveImapConfig = new ResolveImapConfig()
