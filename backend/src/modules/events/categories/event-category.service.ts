import { prisma } from '../../../core/database/prisma';
import { EventCategoryDTO } from '../wizard/event-wizard.types';

export class EventCategoryService {
  public static async getCategoriesHierarchy(): Promise<EventCategoryDTO[]> {
    const allCategories = await prisma.eventCategory.findMany({
      where: { active: true }
    });

    const rootCategories = allCategories.filter((c: any) => !c.parentId);

    return rootCategories.map((root: any) => ({
      id: root.id,
      name: root.name,
      slug: root.slug,
      parentId: null,
      active: root.active,
      sortOrder: root.sortOrder,
      subcategories: allCategories
        .filter((sub: any) => sub.parentId === root.id)
        .map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          parentId: root.id,
          active: sub.active,
          sortOrder: sub.sortOrder
        }))
    }));
  }

  public static async findById(id: string): Promise<any | null> {
    return prisma.eventCategory.findUnique({ where: { id } });
  }

  public static async findBySlug(slug: string): Promise<any | null> {
    return prisma.eventCategory.findUnique({ where: { slug } });
  }
}
