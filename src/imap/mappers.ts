import type { IImapProviderDefault } from '../database/models/ImapProviderDefaultModel'
import type { IImapAddressOverride } from '../database/models/ImapAddressOverrideModel'
import type { IImapConfig } from '../database/models/ImapConfigModel'
import type { ImapProviderDefault, ImapAddressOverride, ImapConfig, NamedImapConfig } from '../types'
import { decrypt } from '../encryption/Decrypt'

export function mapProviderDefaultDoc(doc: IImapProviderDefault): ImapProviderDefault {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    provider: doc.provider,
    imapHost: doc.imapHost,
    imapPort: doc.imapPort,
    useSsl: doc.useSsl,
    username: doc.username,
    passwordEncrypted: doc.passwordEncrypted,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function mapAddressOverrideDoc(doc: IImapAddressOverride): ImapAddressOverride {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    emailAddress: doc.emailAddress,
    imapConfigId: doc.imapConfigId ? doc.imapConfigId.toString() : null,
    imapHost: doc.imapHost ?? null,
    imapPort: doc.imapPort ?? null,
    useSsl: doc.useSsl ?? null,
    username: doc.username ?? null,
    passwordEncrypted: doc.passwordEncrypted ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function mapImapConfigDoc(doc: IImapConfig): NamedImapConfig {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    imapHost: doc.imapHost,
    imapPort: doc.imapPort,
    useSsl: doc.useSsl,
    username: doc.username,
    passwordEncrypted: doc.passwordEncrypted,
    isDefault: doc.isDefault,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function toImapConfig(entry: ImapProviderDefault | NamedImapConfig): ImapConfig {
  return {
    host: entry.imapHost,
    port: entry.imapPort,
    secure: entry.useSsl,
    auth: {
      user: entry.username,
      pass: decrypt.execute(entry.passwordEncrypted),
    },
  }
}

export function toImapConfigFromInlineOverride(override: ImapAddressOverride): ImapConfig | null {
  if (!override.imapHost || !override.username || !override.passwordEncrypted) return null
  return {
    host: override.imapHost,
    port: override.imapPort ?? 993,
    secure: override.useSsl ?? true,
    auth: {
      user: override.username,
      pass: decrypt.execute(override.passwordEncrypted),
    },
  }
}
