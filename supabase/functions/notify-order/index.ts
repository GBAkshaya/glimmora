// Glimmora — auto-notify on order placement
//
// Triggered by the client right after `create_order` succeeds. Does two things, in order:
//   1. Generates a PDF order summary and sends it to the store's WhatsApp (via an approved
//      WhatsApp Cloud API template) using the store's own WhatsApp Business number.
//   2. Sends the payment QR code + a greeting message to the customer's WhatsApp (also via an
//      approved template).
//
// Everything past this point (payment confirmation, status updates) stays manual, handled by the
// admin from /admin/orders as before.
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY  (SUPABASE_URL/ANON_KEY are
//     auto-injected by the platform; only SERVICE_ROLE_KEY needs to be set manually)
//   WHATSAPP_ACCESS_TOKEN        — permanent token for the WhatsApp Business system user
//   WHATSAPP_PHONE_NUMBER_ID     — the sending number's Phone Number ID from Meta
//   WHATSAPP_ADMIN_NUMBER        — store owner's WhatsApp number, digits only, e.g. 916238136984
//   WHATSAPP_ORDER_TEMPLATE_NAME    — default "order_summary_admin"
//   WHATSAPP_PAYMENT_TEMPLATE_NAME  — default "payment_request_customer"
//   WHATSAPP_TEMPLATE_LANG          — default "en"

import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
const WHATSAPP_ADMIN_NUMBER = Deno.env.get('WHATSAPP_ADMIN_NUMBER')!
const WHATSAPP_ORDER_TEMPLATE = Deno.env.get('WHATSAPP_ORDER_TEMPLATE_NAME') ?? 'order_summary_admin'
const WHATSAPP_PAYMENT_TEMPLATE = Deno.env.get('WHATSAPP_PAYMENT_TEMPLATE_NAME') ?? 'payment_request_customer'
const WHATSAPP_TEMPLATE_LANG = Deno.env.get('WHATSAPP_TEMPLATE_LANG') ?? 'en'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ShippingAddress = {
  full_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
}

type OrderItem = {
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

type OrderWithItems = {
  id: string
  order_number: string | null
  created_at: string
  subtotal: number
  discount_amount: number
  gift_wrap: boolean
  gift_wrap_fee: number
  total: number
  shipping_address: ShippingAddress
  whatsapp_number: string
  order_items: OrderItem[]
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function formatInr(n: number) {
  return `Rs. ${n.toFixed(2)}`
}

async function buildOrderPdf(order: OrderWithItems): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = 800
  const left = 50
  const gold = rgb(0.66, 0.49, 0.24)
  const dark = rgb(0.16, 0.16, 0.16)
  const grey = rgb(0.8, 0.8, 0.8)

  const draw = (
    text: string,
    opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb>; x?: number } = {},
  ) => {
    page.drawText(text, {
      x: opts.x ?? left,
      y,
      size: opts.size ?? 11,
      font: opts.f ?? font,
      color: opts.color ?? dark,
    })
  }

  draw('Glimmora', { size: 22, f: bold, color: gold })
  y -= 18
  draw('The Aura of Elegance', { size: 10, color: gold })
  y -= 30

  draw(`Order #${order.order_number ?? order.id.slice(0, 8)}`, { size: 13, f: bold })
  y -= 16
  draw(`Placed: ${new Date(order.created_at).toLocaleString('en-IN')}`, { size: 10 })
  y -= 24

  draw('Bill To', { size: 11, f: bold })
  y -= 14
  draw(order.shipping_address.full_name, { size: 10 })
  y -= 13
  const addrLine2 = order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''
  draw(`${order.shipping_address.address_line1}${addrLine2}`, { size: 10 })
  y -= 13
  draw(`${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`, {
    size: 10,
  })
  y -= 13
  draw(`Contact: ${order.whatsapp_number}`, { size: 10 })
  y -= 26

  draw('Item', { size: 10, f: bold })
  draw('Qty', { size: 10, f: bold, x: 350 })
  draw('Unit Price', { size: 10, f: bold, x: 410 })
  draw('Line Total', { size: 10, f: bold, x: 500 })
  y -= 6
  page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 0.5, color: grey })
  y -= 16

  for (const item of order.order_items) {
    draw(item.product_name.slice(0, 45), { size: 10 })
    draw(String(item.quantity), { size: 10, x: 350 })
    draw(formatInr(item.unit_price), { size: 10, x: 410 })
    draw(formatInr(item.line_total), { size: 10, x: 500 })
    y -= 18
  }

  y -= 10
  page.drawLine({ start: { x: 350, y }, end: { x: 545, y }, thickness: 0.5, color: grey })
  y -= 18

  draw('Subtotal', { size: 10, x: 410 })
  draw(formatInr(order.subtotal), { size: 10, x: 500 })
  y -= 16

  if (order.discount_amount > 0) {
    draw('Discount', { size: 10, x: 410 })
    draw(`-${formatInr(order.discount_amount)}`, { size: 10, x: 500 })
    y -= 16
  }
  if (order.gift_wrap) {
    draw('Gift wrap', { size: 10, x: 410 })
    draw(formatInr(order.gift_wrap_fee), { size: 10, x: 500 })
    y -= 16
  }

  y -= 4
  draw('Total', { size: 12, f: bold, x: 410 })
  draw(formatInr(order.total), { size: 12, f: bold, x: 500 })

  return doc.save()
}

async function sendTemplateMessage(opts: {
  to: string
  template: string
  headerType: 'document' | 'image'
  headerLink: string
  filename?: string
  bodyParams: string[]
}) {
  const header =
    opts.headerType === 'document'
      ? { type: 'document', document: { link: opts.headerLink, filename: opts.filename } }
      : { type: 'image', image: { link: opts.headerLink } }

  const components: unknown[] = [{ type: 'header', parameters: [header] }]
  if (opts.bodyParams.length) {
    components.push({ type: 'body', parameters: opts.bodyParams.map((text) => ({ type: 'text', text })) })
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: opts.to,
      type: 'template',
      template: { name: opts.template, language: { code: WHATSAPP_TEMPLATE_LANG }, components },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`WhatsApp send failed (${opts.template} -> ${opts.to}): ${JSON.stringify(data)}`)
  }
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { order_id } = await req.json()
    if (!order_id) return json({ error: 'order_id is required' }, 400)

    // Confirm the caller can actually see this order (RLS: owner or admin).
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: owned, error: ownErr } = await callerClient.from('orders').select('id').eq('id', order_id).single()
    if (ownErr || !owned) return json({ error: 'Order not found or not accessible' }, 403)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single<OrderWithItems>()
    if (orderErr || !order) return json({ error: 'Order not found' }, 404)

    const { data: settings } = await admin
      .from('store_settings')
      .select('payment_qr_url')
      .eq('id', true)
      .single()

    const orderNumber = order.order_number ?? order.id.slice(0, 8)
    const address = `${order.shipping_address.address_line1}${
      order.shipping_address.address_line2 ? ', ' + order.shipping_address.address_line2 : ''
    }, ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`

    const pdfBytes = await buildOrderPdf(order)
    const pdfPath = `${order.id}/order-${orderNumber}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('order-invoices')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (uploadErr) throw new Error(`PDF upload failed: ${uploadErr.message}`)
    // The bucket is private (it contains the customer's name, address and phone
    // number) — hand WhatsApp a short-lived signed URL instead of a public one.
    // An hour is far more than WhatsApp's servers need to fetch it once at send time.
    const { data: signedData, error: signErr } = await admin.storage
      .from('order-invoices')
      .createSignedUrl(pdfPath, 3600)
    if (signErr || !signedData) throw new Error(`Could not sign PDF URL: ${signErr?.message}`)
    const pdfUrl = signedData.signedUrl

    await sendTemplateMessage({
      to: WHATSAPP_ADMIN_NUMBER,
      template: WHATSAPP_ORDER_TEMPLATE,
      headerType: 'document',
      headerLink: pdfUrl,
      filename: `Order-${orderNumber}.pdf`,
      bodyParams: [orderNumber, order.shipping_address.full_name, formatInr(order.total), address],
    })

    if (settings?.payment_qr_url) {
      await sendTemplateMessage({
        to: order.whatsapp_number.replace(/\D/g, ''),
        template: WHATSAPP_PAYMENT_TEMPLATE,
        headerType: 'image',
        headerLink: settings.payment_qr_url,
        bodyParams: [],
      })
    }

    return json({ ok: true, pdfUrl })
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
