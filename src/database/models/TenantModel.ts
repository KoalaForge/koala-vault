import { Schema, model, Document, Types } from 'mongoose'

export interface ITenant extends Document {
  _id: Types.ObjectId
  name: string
  botToken: string
  ownerTelegramId: string
  isMaster: boolean
  isActive: boolean
  whitelistEnabled: boolean
  webhookUrl?: string
  logChannelId?: string | null
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    botToken: { type: String, required: true, unique: true },
    ownerTelegramId: { type: String, required: true },
    isMaster: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    whitelistEnabled: { type: Boolean, default: true },
    webhookUrl: { type: String },
    logChannelId: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export const TenantModel = model<ITenant>('Tenant', TenantSchema)
