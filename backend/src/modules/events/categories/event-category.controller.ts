import { Request, Response } from 'express';
import { EventCategoryService } from './event-category.service';

export class EventCategoryController {
  public static async listCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await EventCategoryService.getCategoriesHierarchy();
      res.json({
        success: true,
        data: categories
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar categorias de eventos'
      });
    }
  }
}
