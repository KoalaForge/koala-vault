import { Schema, model, Document, Types } from 'mongoose'

export interface ICategory extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  name: string
  slug: string
  subjectKeywords: string[]
  extractionRegexList: string[]
  displayOrder: number
  isActive: boolean
  isGlobal: boolean
  isDefault: boolean
  defaultForTenants: string[]
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    name: { type: String, required: true },
    slug: { type: String },
    subjectKeywords: { type: [String], required: true },
    extractionRegexList: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isGlobal: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    defaultForTenants: { type: [String], default: [] },
  },
  { timestamps: true }
)

CategorySchema.index({ tenantId: 1, isActive: 1, displayOrder: 1 })
CategorySchema.index({ isGlobal: 1, isActive: 1 })
CategorySchema.index({ tenantId: 1, isActive: 1, isDefault: 1 })
CategorySchema.index({ tenantId: 1, slug: 1 }, { unique: true, sparse: true })

export const CategoryModel = model<ICategory>('Category', CategorySchema)
