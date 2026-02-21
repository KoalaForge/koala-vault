import type { ICategory } from '../database/models/CategoryModel'
import type { Category } from '../types'

export function mapCategoryDoc(doc: ICategory): Category {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    name: doc.name,
    subjectKeywords: doc.subjectKeywords,
    extractionRegex: doc.extractionRegex,
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    isGlobal: doc.isGlobal,
    isDefault: doc.isDefault ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
