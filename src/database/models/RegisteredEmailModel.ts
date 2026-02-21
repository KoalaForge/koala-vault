import { Schema, model, Types } from 'mongoose'
import type { Document } from 'mongoose'

export interface IRegisteredEmail extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  emailAddress: string
  provider: string
  addedByTelegramId: string
  createdAt: Date
}

const RegisteredEmailSchema = new Schema<IRegisteredEmail>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    emailAddress: { type: String, required: true, lowercase: true, trim: true },
    provider: { type: String, required: true, default: 'gmail' },
    addedByTelegramId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

RegisteredEmailSchema.index(
  { tenantId: 1, emailAddress: 1 },
  { unique: true },
)

export const RegisteredEmailModel = model<IRegisteredEmail>('RegisteredEmail', RegisteredEmailSchema)
