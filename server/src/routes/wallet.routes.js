import express from 'express'
import { authenticate } from '../middleware/auth.js'
import * as walletController from '../controllers/wallet.controller.js'

const router = express.Router()

router.post('/create', authenticate, walletController.createWallet)
router.get('/info', authenticate, walletController.getWalletInfo)
router.get('/balance', authenticate, walletController.getBalance)
router.post('/lightning-address', authenticate, walletController.createLightningAddress)

export default router
