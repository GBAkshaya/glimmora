import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type CartItem = { productId: string; quantity: number }

type CartContextValue = {
  items: CartItem[]
  giftWrap: boolean
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleGiftWrap: () => void
}

const STORAGE_KEY = 'glimmora_cart'
const GIFT_WRAP_KEY = 'glimmora_gift_wrap'

const CartContext = createContext<CartContextValue | undefined>(undefined)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [giftWrap, setGiftWrap] = useState(() => localStorage.getItem(GIFT_WRAP_KEY) === 'true')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem(GIFT_WRAP_KEY, String(giftWrap))
  }, [giftWrap])

  function addToCart(productId: string, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, { productId, quantity }]
    })
  }

  function removeFromCart(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }

  function clearCart() {
    setItems([])
  }

  function toggleGiftWrap() {
    setGiftWrap((prev) => !prev)
  }

  return (
    <CartContext.Provider
      value={{ items, giftWrap, addToCart, removeFromCart, setQuantity, clearCart, toggleGiftWrap }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
