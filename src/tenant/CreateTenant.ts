import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

interface CreateTenantInput {
  name: string
  botToken: string
  ownerTelegramId: string
  isMaster?: boolean
  durationDays?: number
}

class CreateTenant {
  async execute(input: CreateTenantInput): Promise<Tenant> {
    const expiresAt = input.durationDays
      ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
      : null

    const doc = await TenantModel.create({
      name: input.name,
      botToken: input.botToken,
      ownerTelegramId: input.ownerTelegramId,
      isMaster: input.isMaster ?? false,
      expiresAt,
    })
    return mapTenantDoc(doc as any)
  }
}

export const createTenant = new CreateTenant()
