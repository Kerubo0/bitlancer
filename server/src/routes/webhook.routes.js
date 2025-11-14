import express from 'express'
import * as webhookController from '../controllers/webhook.controller.js'

const router = express.Router()

// Bitnob webhooks
router.post('/bitnob', webhookController.handleBitnobWebhook)

export default router
