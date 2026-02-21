import { Schema, model, Document, Types } from 'mongoose'
import type { WhitelistStatus } from '../../types'

export interface IWhitelist extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  telegramUserId: string
  telegramUsername?: string
  status: WhitelistStatus
  approvedByTelegramId?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const WhitelistSchema = new Schema<IWhitelist>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    telegramUserId: { type: String, required: true },
    telegramUsername: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    approvedByTelegramId: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

WhitelistSchema.index({ tenantId: 1, telegramUserId: 1 }, { unique: true })

export const WhitelistModel = model<IWhitelist>('Whitelist', WhitelistSchema)
