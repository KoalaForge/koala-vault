import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

interface UpdateTenantInput {
  id: string
  name?: string
  isActive?: boolean
  whitelistEnabled?: boolean
  webhookUrl?: string
}

class UpdateTenant {
  async execute(input: UpdateTenantInput): Promise<Tenant | null> {
    const update: Record<string, unknown> = {}
    if (input.name !== undefined) update.name = input.name
    if (input.isActive !== undefined) update.isActive = input.isActive
    if (input.whitelistEnabled !== undefined) update.whitelistEnabled = input.whitelistEnabled
    if (input.webhookUrl !== undefined) update.webhookUrl = input.webhookUrl

    const doc = await TenantModel.findByIdAndUpdate(
      input.id,
      { $set: update },
      { new: true }
    ).lean<any>()

    return doc ? mapTenantDoc(doc) : null
  }
}

export const updateTenant = new UpdateTenant()
