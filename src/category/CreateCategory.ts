import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'

interface CreateCategoryInput {
  tenantId: string
  name: string
  subjectKeywords: string[]
  extractionRegexList: string[]
  displayOrder?: number
  isGlobal?: boolean
}

class CreateCategory {
  async execute(input: CreateCategoryInput): Promise<Category> {
    const doc = await CategoryModel.create({
      tenantId: input.tenantId,
      name: input.name,
      subjectKeywords: input.subjectKeywords,
      extractionRegexList: input.extractionRegexList,
      displayOrder: input.displayOrder ?? 0,
      isGlobal: input.isGlobal ?? true,
    })
    return mapCategoryDoc(doc as any)
  }
}

export const createCategory = new CreateCategory()
