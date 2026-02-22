import { CategoryModel } from '../database/models/CategoryModel'
import type { Category } from '../types'
import { mapCategoryDoc } from './mappers'
import { generateSlug } from '../utils/generateSlug'

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
    const slug = await this.buildUniqueSlug(input.tenantId, generateSlug(input.name))
    const doc = await CategoryModel.create({
      tenantId: input.tenantId,
      name: input.name,
      slug,
      subjectKeywords: input.subjectKeywords,
      extractionRegexList: input.extractionRegexList,
      displayOrder: input.displayOrder ?? 0,
      isGlobal: input.isGlobal ?? true,
    })
    return mapCategoryDoc(doc as any)
  }

  private async buildUniqueSlug(tenantId: string, base: string): Promise<string> {
    let slug = base
    let counter = 2
    while (await CategoryModel.exists({ tenantId, slug })) {
      slug = `${base}-${counter++}`
    }
    return slug
  }
}

export const createCategory = new CreateCategory()
