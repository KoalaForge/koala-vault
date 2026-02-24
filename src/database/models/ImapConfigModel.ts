import { Schema, model, Document, Types } from 'mongoose'

export interface IImapConfig extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  name: string
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  passwordEncrypted: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const ImapConfigSchema = new Schema<IImapConfig>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    name: { type: String, required: true },
    imapHost: { type: String, required: true },
    imapPort: { type: Number, required: true, default: 993 },
    useSsl: { type: Boolean, default: true },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ImapConfigSchema.index({ tenantId: 1, name: 1 }, { unique: true })
ImapConfigSchema.index({ tenantId: 1, isDefault: 1 })

export const ImapConfigModel = model<IImapConfig>('ImapConfig', ImapConfigSchema)
