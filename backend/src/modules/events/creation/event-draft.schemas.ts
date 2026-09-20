import { z } from 'zod';

export const createDraftSchema = z.object({
  producerId: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
  categoryId: z.string().optional(),
  format: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).optional(),
  startAt: z.string().datetime().optional().or(z.string().optional()),
  endAt: z.string().datetime().optional().or(z.string().optional()),
  timezone: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional()
});

export const patchDraftSchema = z.object({
  version: z.number().int().min(1),
  // Step 1: Info
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  format: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).optional(),
  ageRating: z.string().optional(),
  ageRatingDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  // Step 2: Org
  publicOrganizerName: z.string().nullable().optional(),
  operationalContact: z.string().nullable().optional(),
  operationalEmail: z.string().email('E-mail operacional inválido').nullable().optional().or(z.literal('')),
  internalResponsibleUserId: z.string().nullable().optional(),
  // Step 3: Local
  venue: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().optional(),
  estimatedCapacity: z.number().int().min(0).nullable().optional(),
  onlinePlatform: z.string().nullable().optional(),
  onlineUrl: z.string().url('URL online inválida').nullable().optional().or(z.literal('')),
  onlineInstructions: z.string().nullable().optional(),
  // Step 4: Datas
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  timezone: z.string().optional(),
  hasMultipleSessions: z.boolean().optional(),
  // Step 5: Visual
  coverDocumentId: z.string().nullable().optional(),
  // Step 6: Configs
  currency: z.string().optional(),
  locale: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']).optional(),
  allowSearchIndexing: z.boolean().optional()
});

export const slugAvailabilityQuerySchema = z.object({
  slug: z.string().min(2, 'Slug deve ter ao menos 2 caracteres'),
  excludeEventId: z.string().optional()
});

export const updateWizardStepSchema = z.object({
  currentStep: z.number().int().min(1).max(8).optional(),
  lastVisitedStep: z.number().int().min(1).max(8).optional(),
  completedSteps: z.array(z.number().int()).optional(),
  stepStatuses: z.record(z.string(), z.string()).optional()
});
