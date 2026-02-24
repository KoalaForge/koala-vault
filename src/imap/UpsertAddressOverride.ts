import { ImapAddressOverrideModel } from '../database/models/ImapAddressOverrideModel'
import type { ImapAddressOverride } from '../types'
import { mapAddressOverrideDoc } from './mappers'
import { encrypt } from '../encryption/Encrypt'

type UpsertAddressOverrideInput = { tenantId: string; emailAddress: string } & (
  | { mode: 'ref'; imapConfigId: string }
  | { mode: 'inline'; imapHost: string; imapPort: number; useSsl: boolean; username: string; password: string }
)

class UpsertAddressOverride {
  async execute(input: UpsertAddressOverrideInput): Promise<ImapAddressOverride> {
    const setFields = input.mode === 'ref'
      ? { imapConfigId: input.imapConfigId, imapHost: null, imapPort: null, useSsl: null, username: null, passwordEncrypted: null }
      : {
          imapConfigId: null,
          imapHost: input.imapHost,
          imapPort: input.imapPort,
          useSsl: input.useSsl,
          username: input.username,
          passwordEncrypted: encrypt.execute(input.password),
        }

    const doc = await ImapAddressOverrideModel.findOneAndUpdate(
      { tenantId: input.tenantId, emailAddress: input.emailAddress.toLowerCase() },
      { $set: setFields },
      { upsert: true, new: true }
    ).lean<any>()

    return mapAddressOverrideDoc(doc)
  }
}

export const upsertAddressOverride = new UpsertAddressOverride()
