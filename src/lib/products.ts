import { supabase } from './supabaseClient'
import type { ProductCardData } from '../components/ProductCard'
import type { ProductSection } from './types'

export async function fetchProductCards(options: {
  categoryId?: string
  featuredOnly?: boolean
  section?: ProductSection
  limit?: number
}): Promise<ProductCardData[]> {
  let query = supabase
    .from('products')
    .select('*, product_images(image_url, sort_order)')
    .eq('is_active', true)
    .order('sort_order', { foreignTable: 'product_images' })
    .order('created_at', { ascending: false })

  if (options.categoryId) query = query.eq('category_id', options.categoryId)
  if (options.featuredOnly) query = query.eq('is_featured', true)
  if (options.section) query = query.eq('section', options.section)
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((product) => {
    const { product_images, ...rest } = product as typeof product & {
      product_images: { image_url: string; sort_order: number }[]
    }
    return { ...rest, image_url: product_images?.[0]?.image_url }
  })
}

export async function searchProducts(query: string): Promise<ProductCardData[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const escaped = trimmed.replace(/[%_]/g, (c) => `\\${c}`)
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(image_url, sort_order)')
    .eq('is_active', true)
    .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    .order('sort_order', { foreignTable: 'product_images' })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((product) => {
    const { product_images, ...rest } = product as typeof product & {
      product_images: { image_url: string; sort_order: number }[]
    }
    return { ...rest, image_url: product_images?.[0]?.image_url }
  })
}

export async function fetchProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  const validIds = ids.filter(
    (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
  if (validIds.length === 0) return []

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(image_url, sort_order)')
    .in('id', validIds)
    .eq('is_active', true)
    .order('sort_order', { foreignTable: 'product_images' })

  if (error) throw error

  return (data ?? []).map((product) => {
    const { product_images, ...rest } = product as typeof product & {
      product_images: { image_url: string; sort_order: number }[]
    }
    return { ...rest, image_url: product_images?.[0]?.image_url }
  })
}
