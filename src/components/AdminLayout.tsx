import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Tag, Image, QrCode, LogOut, Crown } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import writeLogo from '../assets/write.png.png'

const NAV_ITEMS = [
  { to: '/admin', label: 'Products', icon: Package, match: (p: string) => p === '/admin' || p.startsWith('/admin/products') },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, match: (p: string) => p.startsWith('/admin/orders') },
  { to: '/admin/vip-subscribers', label: 'VIP Details', icon: Crown, match: (p: string) => p.startsWith('/admin/vip-subscribers') },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag, match: (p: string) => p.startsWith('/admin/coupons') },
  { to: '/admin/home-content', label: 'Home Content', icon: Image, match: (p: string) => p.startsWith('/admin/home-content') },
  {
    to: '/admin/payment-settings',
    label: 'Payment Settings',
    icon: QrCode,
    match: (p: string) => p.startsWith('/admin/payment-settings'),
  },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const activeItem = NAV_ITEMS.find((item) => item.match(location.pathname)) ?? NAV_ITEMS[0]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cream">
      <aside className="md:w-60 shrink-0 bg-charcoal text-ivory/80 flex md:flex-col">
        <div className="hidden md:flex items-center gap-2 px-5 py-6 border-b border-ivory/10">
          <div>
            <img 
              src={writeLogo} 
              alt="Glimmora" 
              className="h-8 w-auto object-contain mb-1" 
            />
            <p className="text-[11px] tracking-widest uppercase text-gold/70 mt-1">Admin</p>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1 px-3 py-4 overflow-x-auto md:overflow-visible">
          {NAV_ITEMS.map((item) => {
            const isActive = item === activeItem
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive ? 'bg-gold-dark text-ivory' : 'text-ivory/70 hover:bg-ivory/10 hover:text-ivory'
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            )
          })}
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="flex md:hidden items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors whitespace-nowrap"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Log out
          </button>
        </nav>

        <div className="hidden md:block mt-auto px-3 py-4 border-t border-ivory/10">
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors w-full"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-ivory border-b border-gold/10">
          <h1 className="text-lg font-medium">{activeItem.label}</h1>
          <p className="text-sm text-charcoal/50">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="px-6 md:px-8 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
