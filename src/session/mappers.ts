import type { ISession } from '../database/models/SessionModel'
import type { UserSession } from '../types'

export function mapSessionDoc(doc: ISession): UserSession {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    telegramUserId: doc.telegramUserId,
    state: doc.state,
    emailAddresses: doc.emailAddresses,
    selectedCategoryId: doc.selectedCategoryId?.toString() ?? null,
    results: doc.results,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    expiresAt: doc.expiresAt,
  }
}
