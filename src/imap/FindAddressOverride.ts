import { ImapAddressOverrideModel } from '../database/models/ImapAddressOverrideModel'
import type { ImapAddressOverride } from '../types'
import { mapAddressOverrideDoc } from './mappers'

class FindAddressOverride {
  async execute(tenantId: string, emailAddress: string): Promise<ImapAddressOverride | null> {
    const doc = await ImapAddressOverrideModel.findOne({
      tenantId,
      emailAddress: emailAddress.toLowerCase(),
    }).lean<any>()
    return doc ? mapAddressOverrideDoc(doc) : null
  }
}

export const findAddressOverride = new FindAddressOverride()
