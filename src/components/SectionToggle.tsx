import { Link } from 'react-router-dom'
import type { ProductSection } from '../lib/types'

const TABS: { section: ProductSection; label: string; path: string }[] = [
  { section: 'casual', label: 'Casuals', path: '/occasion/casual' },
  { section: 'ethnic', label: 'Ethnic', path: '/occasion/ethnic' },
]

export default function SectionToggle({ current }: { current: ProductSection }) {
  return (
    <div className="inline-flex rounded-full border border-gold/30 bg-white/60 shadow-sm p-1 mx-auto">
      {TABS.map((tab) => {
        const active = tab.section === current
        const activeFill = tab.section === 'casual' ? 'bg-charcoal text-ivory shadow' : 'bg-gold-dark text-ivory shadow'
        return (
          <Link
            key={tab.section}
            to={tab.path}
            className={`px-6 py-2 rounded-full text-sm transition-all duration-200 ${
              active ? activeFill : 'text-charcoal/70 hover:text-charcoal'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
