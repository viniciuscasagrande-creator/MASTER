import { z } from 'zod';

export const venueTypeEnum = z.enum([
  'ARENA',
  'STADIUM',
  'THEATER',
  'CONCERT_HALL',
  'CONVENTION_CENTER',
  'CLUB',
  'BAR_RESTAURANT',
  'OPEN_AIR',
  'RACETRACK',
  'GYMNASIUM',
  'OTHER'
]);

export const createVenueSchema = z.object({
  name: z.string().min(3, 'Nome do local deve ter no mínimo 3 caracteres'),
  type: venueTypeEnum,
  scope: z.enum(['GLOBAL', 'PRODUCER']).optional(),
  producerId: z.string().optional(),
  postalCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado (UF) é obrigatório'),
  country: z.string().default('BR'),
  capacity: z.number().int().nonnegative('Capacidade deve ser zero ou positiva').optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  website: z.string().optional(),
  notes: z.string().optional(),
  documentUrl: z.string().url().optional().or(z.literal(''))
});

export const updateVenueSchema = createVenueSchema.partial();

export const listVenuesFilterSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  type: z.union([venueTypeEnum, z.literal('ALL')]).optional(),
  scope: z.enum(['GLOBAL', 'PRODUCER', 'ALL']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'ALL']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type CreateVenueSchema = z.infer<typeof createVenueSchema>;
export type UpdateVenueSchema = z.infer<typeof updateVenueSchema>;
export type ListVenuesSchema = z.infer<typeof listVenuesFilterSchema>;
