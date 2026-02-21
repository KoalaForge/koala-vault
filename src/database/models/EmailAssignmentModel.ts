import { Schema, model, Types } from 'mongoose'
import type { Document } from 'mongoose'

export interface IEmailAssignment extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  telegramUserId: string
  emailAddress: string
  provider: string
  expiresAt: Date | null
  assignedByTelegramId: string
  createdAt: Date
}

const EmailAssignmentSchema = new Schema<IEmailAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    telegramUserId: { type: String, required: true },
    emailAddress: { type: String, required: true, lowercase: true, trim: true },
    provider: { type: String, required: true, default: 'gmail' },
    expiresAt: { type: Date, default: null },
    assignedByTelegramId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

EmailAssignmentSchema.index(
  { tenantId: 1, telegramUserId: 1, emailAddress: 1 },
  { unique: true },
)
EmailAssignmentSchema.index({ tenantId: 1, telegramUserId: 1 })

// Auto-delete expired assignments (only documents where expiresAt is set)
EmailAssignmentSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: 'date' } } },
)

export const EmailAssignmentModel = model<IEmailAssignment>('EmailAssignment', EmailAssignmentSchema)
