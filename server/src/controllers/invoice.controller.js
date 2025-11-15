import { supabase } from '../utils/db.js'
import bitnobService from '../services/bitnob.service.js'
import PDFDocument from 'pdfkit'
import stream from 'stream'

export const getAllInvoices = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ invoices: data })
  } catch (error) {
    next(error)
  }
}

export const getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Invoice not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const createInvoice = async (req, res, next) => {
  try {
    const { clientName, clientEmail, invoiceItems, subtotal, amountUsd, dueDate } = req.body

    // Get user's wallet
    let { data: profile } = await supabase
      .from('profiles')
      .select('wallet_id, onchain_address, email')
      .eq('id', req.user.id)
      .maybeSingle()

    // Auto-create wallet if user doesn't have one
    if (!profile || !profile.wallet_id) {
      console.log('⚠️  User has no wallet. Auto-creating...')
      
      try {
        // Create wallet via Bitnob
        const walletData = await bitnobService.createWallet(req.user.id, req.user.email)
        
        // Create or update profile with wallet info
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: req.user.id,
            full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0],
            email: req.user.email,
            wallet_id: walletData.walletId,
            onchain_address: walletData.onchainAddress,
            lightning_address: walletData.lightningAddress,
            btc_balance: 0,
            usd_balance: 0,
          })
          .select('wallet_id, onchain_address, email')
          .single()
        
        if (profileError) throw profileError
        
        profile = newProfile
        console.log('✅ Wallet auto-created successfully')
      } catch (walletError) {
        console.error('❌ Failed to auto-create wallet:', walletError)
        return res.status(500).json({ 
          error: 'Failed to create wallet. Please try again or contact support.',
          details: walletError.message 
        })
      }
    }

    // Get BTC exchange rate
    const fxRate = await bitnobService.getBtcUsdRate()
    const amountBtc = await bitnobService.convertUsdToBtc(amountUsd)

    // Generate Lightning invoice (try, but continue if it fails)
    let lightningInvoice = null
    try {
      lightningInvoice = await bitnobService.generateLightningInvoice(
        Math.floor(amountBtc * 100000000), // Convert to satoshis
        `Invoice for ${clientName}`,
        req.user.email
      )
      console.log('✅ Lightning invoice generated')
    } catch (lightningError) {
      console.warn('⚠️  Lightning invoice generation failed:', lightningError.message)
      console.warn('   Invoice will be created with onchain payment only')
    }

    // Generate invoice number
    const { data: invoiceNumberData } = await supabase.rpc('generate_invoice_number')
    const invoiceNumber = invoiceNumberData || `INV-${Date.now()}`

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: req.user.id,
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_email: clientEmail,
        invoice_items: invoiceItems,
        subtotal,
        fx_rate: fxRate,
        amount_usd: amountUsd,
        amount_btc: amountBtc,
        bitnob_invoice_reference: lightningInvoice?.invoiceId || null,
        lightning_invoice: lightningInvoice?.paymentRequest || null,
        payment_request: lightningInvoice?.paymentRequest || null,
        onchain_address: profile.onchain_address, // Use user's onchain address
        status: 'pending',
        due_date: dueDate || null,
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(invoice)
  } catch (error) {
    next(error)
  }
}

export const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    // If amount is updated, recalculate BTC amount
    if (updates.amountUsd) {
      const fxRate = await bitnobService.getBtcUsdRate()
      const amountBtc = await bitnobService.convertUsdToBtc(updates.amountUsd)
      updates.fx_rate = fxRate
      updates.amount_btc = amountBtc
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Invoice not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ success: true, message: 'Invoice deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Server-side PDF generation using PDFKit
    const doc = new PDFDocument({ size: 'A4', margin: 40 })

    // Collect the PDF into a buffer
    const passthrough = new stream.PassThrough()
    const buffers = []
    passthrough.on('data', (chunk) => buffers.push(chunk))
    passthrough.on('end', () => {
      const pdfData = Buffer.concat(buffers)
      const filename = `${invoice.invoice_number || 'invoice'}-${invoice.id || ''}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(pdfData)
    })

    // Pipe PDFKit output to passthrough
    doc.pipe(passthrough)

    // Header
    doc.fontSize(18).text('Invoice', { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Invoice #: ${invoice.invoice_number || ''}`)
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`)
    doc.moveDown(0.5)

    // Client
    doc.text(`Bill To: ${invoice.client_name || ''}`)
    if (invoice.client_email) doc.text(`${invoice.client_email}`)
    doc.moveDown(0.5)

    // Table headings
    doc.fontSize(11)
    doc.text('Description', 40, doc.y, { continued: true })
    doc.text('Qty', 300, doc.y, { continued: true })
    doc.text('Rate', 350, doc.y, { continued: true })
    doc.text('Amount', 430, doc.y)
    doc.moveDown(0.2)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke()
    doc.moveDown(0.5)

    const items = invoice.invoice_items || []
    items.forEach((item) => {
      doc.text(item.description || '', 40, doc.y, { continued: true })
      doc.text(String(item.quantity || ''), 300, doc.y, { continued: true })
      doc.text(`$${(item.rate || 0).toFixed(2)}`, 350, doc.y, { continued: true })
      doc.text(`$${(item.amount || 0).toFixed(2)}`, 430, doc.y)
      doc.moveDown(0.2)
    })

    doc.moveDown(0.5)
    doc.text(`Subtotal: $${(invoice.subtotal || 0).toFixed(2)}`, 350, doc.y)
    doc.moveDown(0.2)
    doc.text(`Total (USD): $${(invoice.amount_usd || 0).toFixed(2)}`, 350, doc.y)

    doc.moveDown(1)
    doc.fontSize(10).text('Thank you for your business!', 40, doc.y)

    // Finalize PDF and end stream
    doc.end()
  } catch (error) {
    next(error)
  }
}
