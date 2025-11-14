import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import * as invoiceController from '../controllers/invoice.controller.js'
import { createInvoiceSchema, updateInvoiceSchema } from '../utils/schemas.js'

const router = express.Router()

router.get('/', authenticate, invoiceController.getAllInvoices)
router.get('/:id', authenticate, invoiceController.getInvoice)
router.post('/', authenticate, validate(createInvoiceSchema), invoiceController.createInvoice)
router.put('/:id', authenticate, validate(updateInvoiceSchema), invoiceController.updateInvoice)
router.delete('/:id', authenticate, invoiceController.deleteInvoice)
router.post('/:id/generate-pdf', authenticate, invoiceController.generatePDF)

export default router
