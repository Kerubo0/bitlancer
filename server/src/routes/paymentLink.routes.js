import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import * as paymentLinkController from '../controllers/paymentLink.controller.js'
import { createPaymentLinkSchema, updatePaymentLinkSchema } from '../utils/schemas.js'

const router = express.Router()

router.get('/', authenticate, paymentLinkController.getAllPaymentLinks)
router.get('/:id', authenticate, paymentLinkController.getPaymentLink)
router.get('/slug/:slug', paymentLinkController.getPaymentLinkBySlug) // Public route
router.post('/', authenticate, validate(createPaymentLinkSchema), paymentLinkController.createPaymentLink)
router.put('/:id', authenticate, validate(updatePaymentLinkSchema), paymentLinkController.updatePaymentLink)
router.delete('/:id', authenticate, paymentLinkController.deletePaymentLink)
router.post('/:id/pay', paymentLinkController.processPayment) // Public route

export default router
