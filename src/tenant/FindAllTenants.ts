import { TenantModel } from '../database/models/TenantModel'
import type { Tenant } from '../types'
import { mapTenantDoc } from './mappers'

class FindAllTenants {
  async execute(): Promise<Tenant[]> {
    const docs = await TenantModel.find({ isActive: true }).sort({ createdAt: 1 }).lean<any[]>()
    return docs.map(mapTenantDoc)
  }
}

export const findAllTenants = new FindAllTenants()
