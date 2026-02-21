import { Schema, model, Document, Types } from 'mongoose'
import type { WhitelistStatus } from '../../types'

export interface IAccessRequest extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  telegramUserId: string
  telegramUsername?: string
  telegramFirstName?: string
  status: WhitelistStatus
  adminMessageId?: number
  resolvedAt?: Date
  resolvedByTelegramId?: string
  createdAt: Date
  updatedAt: Date
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    telegramUserId: { type: String, required: true },
    telegramUsername: { type: String },
    telegramFirstName: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    adminMessageId: { type: Number },
    resolvedAt: { type: Date },
    resolvedByTelegramId: { type: String },
  },
  { timestamps: true }
)

AccessRequestSchema.index({ tenantId: 1, telegramUserId: 1, status: 1 })

export const AccessRequestModel = model<IAccessRequest>('AccessRequest', AccessRequestSchema)
