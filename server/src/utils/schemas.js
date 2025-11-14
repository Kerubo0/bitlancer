import { z } from 'zod'

// Invoice schemas
export const createInvoiceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  invoiceItems: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().positive('Quantity must be positive'),
      rate: z.number().positive('Rate must be positive'),
      amount: z.number().positive('Amount must be positive'),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  amountUsd: z.number().positive('Amount must be positive'),
  dueDate: z.string().optional(),
})

export const updateInvoiceSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  invoiceItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      rate: z.number().positive(),
      amount: z.number().positive(),
    })
  ).optional(),
  subtotal: z.number().positive().optional(),
  amountUsd: z.number().positive().optional(),
  status: z.enum(['pending', 'paid', 'cancelled', 'expired']).optional(),
})

// Payment Link schemas
export const createPaymentLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amountUsd: z.number().positive('Amount must be positive'),
})

export const updatePaymentLinkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amountUsd: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'paid']).optional(),
})

// Payment processing schema
export const processPaymentSchema = z.object({
  paymentMethod: z.enum(['card', 'bank']),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
})
