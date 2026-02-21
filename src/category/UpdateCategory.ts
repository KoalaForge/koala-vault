import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

interface UpdateCategoryInput {
  tenantId: string
  categoryId: string
  name?: string
  subjectKeywords?: string[]
  extractionRegexList?: string[]
  displayOrder?: number
}

class UpdateCategory {
  async execute(input: UpdateCategoryInput): Promise<Category | null> {
    const update: Record<string, unknown> = {}
    if (input.name !== undefined) update.name = input.name
    if (input.subjectKeywords !== undefined) update.subjectKeywords = input.subjectKeywords
    if (input.extractionRegexList !== undefined) update.extractionRegexList = input.extractionRegexList
    if (input.displayOrder !== undefined) update.displayOrder = input.displayOrder

    const doc = await CategoryModel.findOneAndUpdate(
      { _id: input.categoryId, tenantId: input.tenantId },
      { $set: update },
      { new: true }
    ).lean<any>()

    return doc ? mapCategoryDoc(doc) : null
  }
}

export const updateCategory = new UpdateCategory()
