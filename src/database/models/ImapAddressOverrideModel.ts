import { Schema, model, Document, Types } from 'mongoose'

export interface IImapAddressOverride extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  emailAddress: string
  imapConfigId?: Types.ObjectId | null
  imapHost?: string | null
  imapPort?: number | null
  useSsl?: boolean | null
  username?: string | null
  passwordEncrypted?: string | null
  createdAt: Date
  updatedAt: Date
}

const ImapAddressOverrideSchema = new Schema<IImapAddressOverride>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    emailAddress: { type: String, required: true, lowercase: true },
    imapConfigId: { type: Schema.Types.ObjectId, default: null, ref: 'ImapConfig' },
    imapHost: { type: String, default: null },
    imapPort: { type: Number, default: null },
    useSsl: { type: Boolean, default: null },
    username: { type: String, default: null },
    passwordEncrypted: { type: String, default: null },
  },
  { timestamps: true }
)

ImapAddressOverrideSchema.index({ tenantId: 1, emailAddress: 1 }, { unique: true })

export const ImapAddressOverrideModel = model<IImapAddressOverride>(
  'ImapAddressOverride',
  ImapAddressOverrideSchema
)
