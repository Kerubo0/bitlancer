import express from 'express'
import { authenticate } from '../middleware/auth.js'
import * as transactionController from '../controllers/transaction.controller.js'

const router = express.Router()

router.get('/', authenticate, transactionController.getAllTransactions)
router.get('/:id', authenticate, transactionController.getTransaction)

export default router
