import { z } from 'zod';

export const CreateEventTicketTypeSchema = z.object({
  ticketTypeId: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  code: z.string().optional(),
  category: z.enum(['INTEIRA', 'MEIA', 'SOCIAL', 'VIP', 'CORTESIA', 'COMBO', 'PROMOTIONAL', 'OTHER']),
  description: z.string().optional(),
  halfPriceLawCompliance: z.boolean().optional(),
  requiresDocument: z.boolean().optional(),
  documentType: z.string().optional(),
  requiresCode: z.boolean().optional(),
  requiresBenefit: z.boolean().optional(),
  benefitDescription: z.string().optional(),
  minPerOrder: z.number().int().min(1).default(1),
  maxPerOrder: z.number().int().min(1).default(6),
  sectionIds: z.array(z.string()).optional(),
  sessionIds: z.array(z.string()).optional(),
  benefits: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional()
  })).optional()
});

export const UpdateEventTicketTypeSchema = CreateEventTicketTypeSchema.partial().extend({
  active: z.boolean().optional()
});
