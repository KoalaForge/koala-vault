import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

interface CreateTenantInput {
  name: string
  botToken: string
  ownerTelegramId: string
  isMaster?: boolean
}

class CreateTenant {
  async execute(input: CreateTenantInput): Promise<Tenant> {
    const doc = await TenantModel.create({
      name: input.name,
      botToken: input.botToken,
      ownerTelegramId: input.ownerTelegramId,
      isMaster: input.isMaster ?? false,
    })
    return mapTenantDoc(doc as any)
  }
}

export const createTenant = new CreateTenant()
