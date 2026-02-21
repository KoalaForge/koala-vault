import { Schema, model, Types } from 'mongoose'
import type { Document } from 'mongoose'

export interface ICategoryAssignment extends Document {
  _id: Types.ObjectId
  tenantId: Types.ObjectId
  telegramUserId: string
  categoryId: Types.ObjectId
  assignedByTelegramId: string
  createdAt: Date
}

const CategoryAssignmentSchema = new Schema<ICategoryAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true, ref: 'Tenant' },
    telegramUserId: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
    assignedByTelegramId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

CategoryAssignmentSchema.index(
  { tenantId: 1, telegramUserId: 1, categoryId: 1 },
  { unique: true },
)
CategoryAssignmentSchema.index({ tenantId: 1, telegramUserId: 1 })

export const CategoryAssignmentModel = model<ICategoryAssignment>('CategoryAssignment', CategoryAssignmentSchema)
