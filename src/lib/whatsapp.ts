export const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER as string | undefined

export function buildWhatsAppLink(phoneDigitsOnly: string, message: string) {
  return `https://wa.me/${phoneDigitsOnly}?text=${encodeURIComponent(message)}`
}
