import { z } from 'zod';

export const createEventSessionSchema = z.object({
  name: z.string().optional(),
  doorsOpenAt: z.string().optional(),
  startAt: z.string().min(1, 'Data/hora de início é obrigatória'),
  endAt: z.string().optional(),
  timezone: z.string().default('America/Sao_Paulo'),
  venueId: z.string().optional(),
  venueMapVersionId: z.string().optional(),
  status: z
    .enum([
      'DRAFT',
      'CONFIGURED',
      'SCHEDULED',
      'OPEN',
      'IN_PROGRESS',
      'FINISHED',
      'CANCELLED',
      'ARCHIVED'
    ])
    .optional(),
  capacity: z.number().int().positive('Capacidade deve ser maior que zero'),
  isPrimary: z.boolean().optional()
});

export const updateEventSessionSchema = createEventSessionSchema.partial();

export const changeSessionStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'CONFIGURED',
    'SCHEDULED',
    'OPEN',
    'IN_PROGRESS',
    'FINISHED',
    'CANCELLED',
    'ARCHIVED'
  ]),
  reason: z.string().optional()
});

export const duplicateSessionSchema = z.object({
  startAt: z.string().min(1, 'Nova data de início é obrigatória'),
  doorsOpenAt: z.string().optional(),
  endAt: z.string().optional(),
  name: z.string().optional(),
  replicateSections: z.boolean().default(true)
});

export const addReservationSchema = z.object({
  sectionId: z.string().optional(),
  type: z.enum([
    'PRODUCTION',
    'SECURITY',
    'SPONSOR',
    'ARTIST',
    'ACCESSIBILITY',
    'TECHNICAL',
    'OTHER'
  ]),
  quantity: z.number().int().positive('Quantidade deve ser maior que zero'),
  reason: z.string().optional()
});

export const recurrencePreviewSchema = z.object({
  pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DATES']),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  occurrencesCount: z.number().int().positive().max(60).optional(),
  interval: z.number().int().positive().default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  doorsOpenTime: z.string().optional(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().optional(),
  venueId: z.string().min(1, 'Local é obrigatório'),
  namePrefix: z.string().optional(),
  customDates: z.array(z.string()).optional()
});

export const recurrenceBulkCreateSchema = recurrencePreviewSchema.extend({
  capacity: z.number().int().positive('Capacidade é obrigatória'),
  venueMapVersionId: z.string().optional()
});
