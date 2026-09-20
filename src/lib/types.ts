export type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
}

export type ProductSection = 'casual' | 'ethnic'

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  discount_percent: number
  category_id: string
  section: ProductSection
  product_code: string | null
  stock_count: number
  is_featured: boolean
  is_active: boolean
}

export type ProductImage = {
  id: string
  product_id: string
  image_url: string
  sort_order: number
}

export type ShippingAddress = {
  full_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'

export type Order = {
  id: string
  order_number: string | null
  customer_id: string
  status: OrderStatus
  subtotal: number
  discount_amount: number
  gift_wrap: boolean
  gift_wrap_fee: number
  total: number
  shipping_address: ShippingAddress
  whatsapp_number: string
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  line_total: number
}
