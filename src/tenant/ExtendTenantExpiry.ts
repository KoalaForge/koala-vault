import { TenantModel } from '../database/models/TenantModel'

interface ExtendTenantExpiryInput {
  tenantId: string
  days: number
}

interface ExtendTenantExpiryResult {
  newExpiresAt: Date
}

class ExtendTenantExpiry {
  async execute({ tenantId, days }: ExtendTenantExpiryInput): Promise<ExtendTenantExpiryResult> {
    const doc = await TenantModel.findById(tenantId)

    if (!doc || !doc.isActive) {
      throw new Error(`Tenant not found or inactive: ${tenantId}`)
    }

    const now = new Date()
    const base = doc.expiresAt && doc.expiresAt > now ? doc.expiresAt : now
    const newExpiresAt = new Date(base.getTime() + days * 86_400_000)

    await TenantModel.updateOne({ _id: doc._id }, { $set: { expiresAt: newExpiresAt } })

    return { newExpiresAt }
  }
}

export const extendTenantExpiry = new ExtendTenantExpiry()
