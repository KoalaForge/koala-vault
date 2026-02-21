import type { IWhitelist } from '../database/models/WhitelistModel'
import type { IAccessRequest } from '../database/models/AccessRequestModel'
import type { WhitelistEntry, AccessRequest } from '../types'

export function mapWhitelistDoc(doc: IWhitelist): WhitelistEntry {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    telegramUserId: doc.telegramUserId,
    telegramUsername: doc.telegramUsername ?? null,
    status: doc.status,
    approvedByTelegramId: doc.approvedByTelegramId ?? null,
    createdAt: doc.createdAt,
    resolvedAt: doc.resolvedAt ?? null,
  }
}

export function mapAccessRequestDoc(doc: IAccessRequest): AccessRequest {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    telegramUserId: doc.telegramUserId,
    telegramUsername: doc.telegramUsername ?? null,
    telegramFirstName: doc.telegramFirstName ?? null,
    status: doc.status,
    adminMessageId: doc.adminMessageId ?? null,
    createdAt: doc.createdAt,
    resolvedAt: doc.resolvedAt ?? null,
    resolvedByTelegramId: doc.resolvedByTelegramId ?? null,
  }
}
