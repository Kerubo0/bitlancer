import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Health check for auth
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
