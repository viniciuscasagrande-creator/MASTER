import { z } from 'zod';

export const eventStatusEnum = z.enum([
  'DRAFT',
  'CONFIGURING',
  'REVIEW',
  'APPROVAL_PENDING',
  'SCHEDULED',
  'ON_SALE',
  'SALES_PAUSED',
  'SOLD_OUT',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
  'ARCHIVED'
]);

export const listEventsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.union([eventStatusEnum, z.literal('ALL')]).optional(),
  producerId: z.string().trim().optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(10).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  period: z.enum([
    'all',
    'today',
    'next7days',
    'next30days',
    'thisMonth',
    'upcoming',
    'past',
    'custom'
  ]).optional(),
  sortBy: z.enum([
    'date_asc',
    'date_desc',
    'name_asc',
    'name_desc',
    'created_recent',
    'updated_recent'
  ]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional()
});

export const getEventParamsSchema = z.object({
  eventId: z.string().trim().min(1, 'Identificador do evento é obrigatório.')
});

export const createEventSchema = z.object({
  producerId: z.string().trim().min(1, 'ID do Produtor é obrigatório.'),
  name: z.string().trim().min(2, 'Nome do evento deve ter no mínimo 2 caracteres.').max(255),
  title: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  timezone: z.string().trim().default('America/Sao_Paulo'),
  venue: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().default('BR'),
  capacity: z.coerce.number().int().positive().optional(),
  coverDocumentId: z.string().trim().optional()
});
