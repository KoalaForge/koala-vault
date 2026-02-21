import type { IImapProviderDefault } from '../database/models/ImapProviderDefaultModel'
import type { IImapAddressOverride } from '../database/models/ImapAddressOverrideModel'
import type { ImapProviderDefault, ImapAddressOverride, ImapConfig } from '../types'
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
    imapHost: doc.imapHost,
    imapPort: doc.imapPort,
    useSsl: doc.useSsl,
    username: doc.username,
    passwordEncrypted: doc.passwordEncrypted,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function toImapConfig(entry: ImapProviderDefault | ImapAddressOverride): ImapConfig {
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
