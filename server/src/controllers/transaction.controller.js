import { supabase } from '../utils/db.js'

export const getAllTransactions = async (req, res, next) => {
  try {
    const { type, status, limit = 50, offset = 0, startDate, endDate } = req.query

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ transactions: data })
  } catch (error) {
    next(error)
  }
}

export const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Transaction not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}
