import { Schema, model, Document, Types } from 'mongoose'
import type { ImapProvider } from '../../types'

export interface IImapProviderDefault extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  provider: ImapProvider
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  passwordEncrypted: string
  createdAt: Date
  updatedAt: Date
}

const ImapProviderDefaultSchema = new Schema<IImapProviderDefault>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    provider: { type: String, required: true, enum: ['gmail'] },
    imapHost: { type: String, required: true },
    imapPort: { type: Number, required: true, default: 993 },
    useSsl: { type: Boolean, default: true },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true },
  },
  { timestamps: true }
)

ImapProviderDefaultSchema.index({ tenantId: 1, provider: 1 }, { unique: true })

export const ImapProviderDefaultModel = model<IImapProviderDefault>(
  'ImapProviderDefault',
  ImapProviderDefaultSchema
)
