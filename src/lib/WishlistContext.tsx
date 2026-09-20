import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

type WishlistContextValue = {
  productIds: Set<string>
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth()
  const [productIds, setProductIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!customer) {
      setProductIds(new Set())
      return
    }
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('customer_id', customer.id)
      .then(({ data, error }) => {
        if (error) console.error('Failed to load wishlist:', error)
        setProductIds(new Set((data ?? []).map((row) => row.product_id)))
      })
  }, [customer])

  function isWishlisted(productId: string) {
    return productIds.has(productId)
  }

  async function toggleWishlist(productId: string) {
    if (!customer) return

    if (productIds.has(productId)) {
      setProductIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('customer_id', customer.id)
        .eq('product_id', productId)
      if (error) {
        console.error('Failed to remove from wishlist:', error)
        setProductIds((prev) => new Set(prev).add(productId))
      }
    } else {
      setProductIds((prev) => new Set(prev).add(productId))
      const { error } = await supabase.from('wishlists').insert({ customer_id: customer.id, product_id: productId })
      if (error) {
        console.error('Failed to add to wishlist:', error)
        setProductIds((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      }
    }
  }

  return (
    <WishlistContext.Provider value={{ productIds, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
}
