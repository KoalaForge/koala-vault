import type { ImapConfig } from '../types'
import { findAddressOverride } from './FindAddressOverride'
import { findImapConfigById } from './FindImapConfigById'
import { findDefaultImapConfig } from './FindDefaultImapConfig'
import { findProviderDefault } from './FindProviderDefault'
import { deriveProvider } from './DeriveProvider'
import { toImapConfig, toImapConfigFromInlineOverride } from './mappers'

class ResolveImapConfig {
  async execute(tenantId: string, emailAddress: string, providerOverride?: string | null): Promise<ImapConfig | null> {
    const override = await findAddressOverride.execute(tenantId, emailAddress)
    if (override) {
      if (override.imapConfigId) {
        const config = await findImapConfigById.execute(tenantId, override.imapConfigId)
        if (config) return toImapConfig(config)
      } else {
        const inlineConfig = toImapConfigFromInlineOverride(override)
        if (inlineConfig) return inlineConfig
      }
    }

    // Named config default (new step 2)
    const defaultNamedConfig = await findDefaultImapConfig.execute(tenantId)
    if (defaultNamedConfig) return toImapConfig(defaultNamedConfig)

    // Legacy: explicit provider set at registration time — skip domain derivation
    if (providerOverride) {
      const explicitConfig = await findProviderDefault.execute(tenantId, providerOverride as any)
      if (explicitConfig) return toImapConfig(explicitConfig)
    }

    // Auto-derive provider from email domain (gmail.com → gmail)
    const provider = deriveProvider.execute(emailAddress)
    if (provider) {
      const derivedConfig = await findProviderDefault.execute(tenantId, provider)
      if (derivedConfig) return toImapConfig(derivedConfig)
    }

    return null
  }
}

export const resolveImapConfig = new ResolveImapConfig()
