import { ImapAddressOverrideModel } from '../database/models/ImapAddressOverrideModel'
import type { ImapAddressOverride } from '../types'
import { mapAddressOverrideDoc } from './mappers'
import { encrypt } from '../encryption/Encrypt'

interface UpsertAddressOverrideInput {
  tenantId: string
  emailAddress: string
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  password: string
}

class UpsertAddressOverride {
  async execute(input: UpsertAddressOverrideInput): Promise<ImapAddressOverride> {
    const passwordEncrypted = encrypt.execute(input.password)

    const doc = await ImapAddressOverrideModel.findOneAndUpdate(
      { tenantId: input.tenantId, emailAddress: input.emailAddress.toLowerCase() },
      {
        $set: {
          imapHost: input.imapHost,
          imapPort: input.imapPort,
          useSsl: input.useSsl,
          username: input.username,
          passwordEncrypted,
        },
      },
      { upsert: true, new: true }
    ).lean<any>()

    return mapAddressOverrideDoc(doc)
  }
}

export const upsertAddressOverride = new UpsertAddressOverride()
