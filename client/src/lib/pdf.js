import { jsPDF } from 'jspdf'

export function generateInvoicePdf(invoice) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const margin = 40
  let y = margin

  doc.setFontSize(18)
  doc.text('Invoice', margin, y)
  y += 30

  doc.setFontSize(12)
  doc.text(`Invoice #: ${invoice.invoice_number || ''}`, margin, y)
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 400, y)
  y += 20

  doc.text(`Bill To: ${invoice.client_name || ''}`, margin, y)
  y += 16
  doc.text(`${invoice.client_email || ''}`, margin, y)
  y += 24

  // Table header
  doc.setFontSize(11)
  doc.text('Description', margin, y)
  doc.text('Qty', 360, y)
  doc.text('Rate', 420, y)
  doc.text('Amount', 500, y)
  y += 12
  doc.setLineWidth(0.5)
  doc.line(margin, y, 555, y)
  y += 10

  // Items
  const items = invoice.invoice_items || []
  items.forEach((item) => {
    doc.text(item.description || '', margin, y)
    doc.text(String(item.quantity || ''), 360, y)
    doc.text(`$${(item.rate || 0).toFixed(2)}`, 420, y)
    doc.text(`$${(item.amount || 0).toFixed(2)}`, 500, y)
    y += 18
    if (y > 740) {
      doc.addPage()
      y = margin
    }
  })

  y += 8
  doc.setLineWidth(0.5)
  doc.line(margin, y, 555, y)
  y += 16

  doc.setFontSize(12)
  doc.text('Subtotal:', 420, y)
  doc.text(`$${(invoice.subtotal || 0).toFixed(2)}`, 500, y)
  y += 18
  doc.text('Total (USD):', 420, y)
  doc.text(`$${(invoice.amount_usd || 0).toFixed(2)}`, 500, y)

  // Footer / notes
  y += 40
  doc.setFontSize(10)
  doc.text('Thank you for your business!', margin, y)

  const filename = `${invoice.invoice_number || 'invoice'}-${invoice.id || ''}.pdf`
  doc.save(filename)
}

export default generateInvoicePdf
