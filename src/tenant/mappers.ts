import type { ITenant } from '../database/models/TenantModel'
import type { Tenant } from '../types'

export function mapTenantDoc(doc: ITenant): Tenant {
  return {
    id: doc._id.toString(),
    name: doc.name,
    botToken: doc.botToken,
    ownerTelegramId: String(doc.ownerTelegramId),
    isMaster: doc.isMaster,
    isActive: doc.isActive,
    whitelistEnabled: doc.whitelistEnabled,
    webhookUrl: doc.webhookUrl ?? null,
    expiresAt: doc.expiresAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
