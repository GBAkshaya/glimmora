import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, User, Search, X, Home, Layers, Gift, Star } from 'lucide-react'
import { useCart } from '../lib/CartContext'
import { useWishlist } from '../lib/WishlistContext'
import { LimelightNav, type NavItem } from './ui/limelight-nav'

function IconLink({
  to,
  count,
  label,
  icon,
}: {
  to: string
  count: number
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link to={to} aria-label={label} className="relative p-2 rounded-full hover:bg-gold/10 transition-colors">
      {icon}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gold-dark text-ivory text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center font-medium">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export default function Navbar() {
  const { items } = useCart()
  const { productIds } = useWishlist()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  let defaultActiveIndex = 0
  if (location.pathname.startsWith('/collections')) defaultActiveIndex = 1
  else if (location.pathname.startsWith('/occasion')) defaultActiveIndex = 2
  else if (location.pathname.startsWith('/best-sellers')) defaultActiveIndex = 3

  const navItems: NavItem[] = [
    { id: 'home', icon: <Home />, label: 'Home', href: '/', onClick: () => navigate('/') },
    { id: 'collections', icon: <Layers />, label: 'Collections', href: '/collections', onClick: () => navigate('/collections') },
    { id: 'occasion', icon: <Gift />, label: 'Occasion', href: '/occasion', onClick: () => navigate('/occasion') },
    { id: 'bestsellers', icon: <Star />, label: 'Best Sellers', href: '/best-sellers', onClick: () => navigate('/best-sellers') },
  ]

  const mobileNavItems: NavItem[] = [
    { id: 'home', icon: <Home />, label: 'Home', href: '/', onClick: () => navigate('/') },
    { id: 'collections', icon: <Layers />, label: 'Shop', href: '/collections', onClick: () => navigate('/collections') },
    { id: 'occasion', icon: <Gift />, label: 'Occasion', href: '/occasion', onClick: () => navigate('/occasion') },
    { id: 'bestsellers', icon: <Star />, label: 'Trending', href: '/best-sellers', onClick: () => navigate('/best-sellers') },
  ]

  return (
    <>
      <header className="sticky top-3 mt-3 mb-4 z-40 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-full max-w-5xl mx-auto bg-ivory/90 backdrop-blur-md border border-gold/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
        <nav className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 gap-2 sm:gap-6">
          <Link to="/" className="font-logo text-xl sm:text-2xl text-gold-dark shrink-0">
            Glimmora
          </Link>

          {/* Desktop Limelight Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <LimelightNav items={navItems} defaultActiveIndex={defaultActiveIndex} />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className={`p-2 rounded-full hover:bg-gold/10 transition-colors text-charcoal ${searchOpen ? 'bg-gold/10' : ''}`}
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
            <IconLink to="/wishlist" count={productIds.size} label="Wishlist" icon={<Heart size={18} strokeWidth={1.75} />} />
            <IconLink to="/cart" count={cartCount} label="Cart" icon={<ShoppingBag size={18} strokeWidth={1.75} />} />
            <Link
              to="/account"
              aria-label="Account"
              className="p-2 rounded-full hover:bg-gold/10 transition-colors text-charcoal"
            >
              <User size={18} strokeWidth={1.75} />
            </Link>
          </div>
        </nav>

        {searchOpen && (
          <div className="px-3 sm:px-6 pb-3">
            <form
              onSubmit={submitSearch}
              className="flex items-center gap-2 bg-ivory rounded-full border border-gold/30 px-4 py-2 shadow-sm"
            >
              <Search size={16} className="text-charcoal/40 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 text-sm outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="text-charcoal/40 hover:text-charcoal shrink-0"
              >
                <X size={16} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Floating Bottom Nav Dock for Mobile Devices */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 md:hidden w-[92%] max-w-[360px] bg-ivory/95 backdrop-blur-xl border border-gold/30 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.15)] px-2 py-0.5 flex justify-center">
        <LimelightNav
          items={mobileNavItems}
          defaultActiveIndex={defaultActiveIndex}
          className="w-full justify-around"
          iconContainerClassName="px-1.5 sm:px-3"
          labelClassName="text-[10px] sm:text-xs"
        />
      </div>
    </>
  )
}
