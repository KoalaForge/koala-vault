import { Schema, model, Document, Types } from 'mongoose'
import type { SessionState, EmailResult } from '../../types'

export interface ISession extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  telegramUserId: string
  state: SessionState
  emailAddresses: Array<{ emailAddress: string; provider: string | null }>
  selectedCategoryId?: Types.ObjectId
  results: Record<string, EmailResult>
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const SessionSchema = new Schema<ISession>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    telegramUserId: { type: String, required: true },
    state: {
      type: String,
      enum: ['AWAITING_EMAILS', 'AWAITING_CATEGORY', 'SEARCHING', 'RESULTS_SHOWN', 'COMPLETED'],
      default: 'AWAITING_EMAILS',
    },
    emailAddresses: {
      type: [{ emailAddress: String, provider: { type: String, default: null } }],
      default: [],
    },
    selectedCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    results: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

SessionSchema.index({ tenantId: 1, telegramUserId: 1 }, { unique: true })
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const SessionModel = model<ISession>('Session', SessionSchema)
