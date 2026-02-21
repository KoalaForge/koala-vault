import { Schema, model, Document, Types } from 'mongoose'

export interface IImapAddressOverride extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  emailAddress: string
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  passwordEncrypted: string
  createdAt: Date
  updatedAt: Date
}

const ImapAddressOverrideSchema = new Schema<IImapAddressOverride>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    emailAddress: { type: String, required: true, lowercase: true },
    imapHost: { type: String, required: true },
    imapPort: { type: Number, required: true, default: 993 },
    useSsl: { type: Boolean, default: true },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true },
  },
  { timestamps: true }
)

ImapAddressOverrideSchema.index({ tenantId: 1, emailAddress: 1 }, { unique: true })

export const ImapAddressOverrideModel = model<IImapAddressOverride>(
  'ImapAddressOverride',
  ImapAddressOverrideSchema
)
