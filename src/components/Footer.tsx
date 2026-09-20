import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AtSign,
  Mail,
  MessageCircle,
  Truck,
  ShieldCheck,
  Gift,
  RefreshCw,
  ArrowUp,
  Sparkles,
  CheckCircle2,
  Phone
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { ADMIN_WHATSAPP_NUMBER, buildWhatsAppLink } from '../lib/whatsapp'
import writeLogo from '../assets/write.png.png'
import logo from '../assets/logo.png.png'
import textLogo from '../assets/text.png.png'

const GLIMMORA_EMAIL = 'glimmora.jewels@gmail.com'
const DEFAULT_INSTAGRAM_LINK = 'https://instagram.com/glimmora.in'

export default function Footer() {
  const [instagramLink, setInstagramLink] = useState(DEFAULT_INSTAGRAM_LINK)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    supabase
      .from('home_content')
      .select('link_url')
      .eq('section', 'follow_the_glow')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.link_url) setInstagramLink(data.link_url)
      })

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const cleanNum = whatsappNumber.replace(/\D/g, '')

    if (!cleanNum || cleanNum.length < 7) {
      setErrorMessage('Please enter a valid WhatsApp number.')
      return
    }

    setNewsletterStatus('submitting')

    const formattedNum = cleanNum.startsWith('91') ? cleanNum : cleanNum.length === 10 ? `91${cleanNum}` : cleanNum

    const { error: sbError } = await supabase.from('vip_subscribers').insert({
      whatsapp_number: formattedNum,
    })

    if (sbError && sbError.code !== '23505') {
      // Anything other than "already subscribed" is a real failure — don't claim success.
      console.error('VIP subscribe failed:', sbError)
      setErrorMessage('Something went wrong — please try again.')
      setNewsletterStatus('idle')
      return
    }

    setNewsletterStatus('success')
    setWhatsappNumber('')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-gold/20 bg-gradient-to-b from-ivory via-cream/80 to-ivory text-charcoal relative overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gold/5 blur-3xl pointer-events-none rounded-full" />

      {/* 1. "Why Glimmora" Promise Section */}
      <div className="border-b border-gold/15 bg-white/50 backdrop-blur-md py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="eyebrow text-gold-dark font-medium tracking-[0.25em] uppercase">
              The Glimmora Promise
            </span>
            <h3 className="font-logo text-2xl md:text-3xl font-normal text-charcoal mt-1">
              Why <span className="italic text-gold-dark">Glimmora</span>
            </h3>
            <div className="w-12 h-0.5 bg-gold/40 mx-auto mt-2.5 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-ivory/80 border border-gold/15 shadow-xs hover:border-gold/35 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 group-hover:scale-110 group-hover:bg-gold/25 transition-all">
                <ShieldCheck size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-charcoal group-hover:text-gold-dark transition-colors">Everyday Durability</h4>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold-dark border border-gold/30">Anti-Tarnish</span>
                </div>
                <p className="text-xs text-charcoal/65 leading-relaxed">
                  Skin-friendly coating built to preserve its brilliant shine day after day.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-ivory/80 border border-gold/15 shadow-xs hover:border-gold/35 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 group-hover:scale-110 group-hover:bg-gold/25 transition-all">
                <Truck size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-charcoal group-hover:text-gold-dark transition-colors">Doorstep Delivery</h4>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold-dark border border-gold/30">Insured Shipping</span>
                </div>
                <p className="text-xs text-charcoal/65 leading-relaxed">
                  Tamper-proof insured express delivery right to your doorstep across India.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-ivory/80 border border-gold/15 shadow-xs hover:border-gold/35 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 group-hover:scale-110 group-hover:bg-gold/25 transition-all">
                <RefreshCw size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-charcoal group-hover:text-gold-dark transition-colors">Easy Returns</h4>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold-dark border border-gold/30">7-Day Policy</span>
                </div>
                <p className="text-xs text-charcoal/65 leading-relaxed">
                  Hassle-free 7-day return or exchange policy for complete peace of mind.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-ivory/80 border border-gold/15 shadow-xs hover:border-gold/35 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 group-hover:scale-110 group-hover:bg-gold/25 transition-all">
                <Gift size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-charcoal group-hover:text-gold-dark transition-colors">Luxury Gift Wrap</h4>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold-dark border border-gold/30">Signature Box</span>
                </div>
                <p className="text-xs text-charcoal/65 leading-relaxed">
                  Encased in Glimmora’s royal velvet jewelry box with custom satin ribbon wrapping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIP WhatsApp Banner ("The Glimmora Circle") */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="relative rounded-2xl bg-gradient-to-r from-charcoal via-charcoal/95 to-charcoal text-ivory p-8 md:p-10 shadow-xl overflow-hidden border border-gold/30">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium tracking-widest uppercase mb-3 border border-gold/30">
                <Sparkles size={13} className="text-gold" />
                The Glimmora Circle
              </div>
              <h3 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-normal">
                Elevate Your Jewelry Collection
              </h3>
              <p className="text-sm text-ivory/70 mt-2 font-light leading-relaxed">
                Join our VIP inner circle on WhatsApp to receive private previews of new launches, exclusive secret offers &amp; bespoke jewelry care guides.
              </p>
            </div>

            <div className="w-full lg:w-auto min-w-[320px] md:min-w-[420px]">
              {newsletterStatus === 'success' ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gold/20 border border-gold/40 text-gold text-sm font-medium animate-fadeIn">
                  <CheckCircle2 size={18} />
                  <span>Welcome to the VIP Circle! ✦ Your WhatsApp number is saved.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
                      <input
                        type="tel"
                        required
                        placeholder="Enter your WhatsApp number (e.g. 9876543210)"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-ivory text-charcoal placeholder-charcoal/50 text-sm rounded-xl border border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all shadow-inner font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'submitting'}
                      className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-white font-medium text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 border border-gold/40"
                    >
                      {newsletterStatus === 'submitting' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Join VIP</span>
                          <Sparkles size={15} />
                        </>
                      )}
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="text-xs text-red-300 font-medium text-center sm:text-left mt-1">{errorMessage}</p>
                  )}
                </form>
              )}
              <p className="text-[11px] text-ivory/40 text-center lg:text-left mt-2 font-light">
                We respect your privacy. No spam. Only official VIP offers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Multi-Column Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand & Social Column */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
              <img
                src={logo}
                alt="Glimmora Logo"
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
              />
              <img
                src={writeLogo}
                alt="Glimmora"
                className="h-10 md:h-12 w-auto object-contain mix-blend-multiply transition-all duration-300 group-hover:brightness-110"
              />
            </Link>
            
            <p className="text-sm text-charcoal/70 max-w-sm font-light leading-relaxed mb-6">
              Redefining contemporary luxury through premium anti-tarnish design &amp; timeless elegance. Designed to capture your sparkle for every special moment.
            </p>

            {/* Social Hub */}
            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest text-gold-dark/90 font-semibold block mb-3">
                Follow The Glow
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-white border border-gold/20 flex items-center justify-center text-charcoal/70 hover:text-gold-dark hover:border-gold hover:bg-gold/10 hover:shadow-md transition-all duration-300 group"
                >
                  <AtSign size={18} className="group-hover:scale-110 transition-transform" />
                </a>

                {ADMIN_WHATSAPP_NUMBER && (
                  <a
                    href={buildWhatsAppLink(ADMIN_WHATSAPP_NUMBER, "Hi Glimmora! I have a question about your collections.")}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp Concierge"
                    className="w-10 h-10 rounded-xl bg-white border border-gold/20 flex items-center justify-center text-charcoal/70 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md transition-all duration-300 group"
                  >
                    <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                  </a>
                )}

                <a
                  href={`mailto:${GLIMMORA_EMAIL}`}
                  aria-label="Email Us"
                  className="w-10 h-10 rounded-xl bg-white border border-gold/20 flex items-center justify-center text-charcoal/70 hover:text-gold-dark hover:border-gold hover:bg-gold/10 hover:shadow-md transition-all duration-300 group"
                >
                  <Mail size={18} className="group-hover:scale-110 transition-transform" />
                </a>

                <div className="w-10 h-10 rounded-xl bg-white border border-gold/20 flex items-center justify-center text-charcoal/40 hover:text-gold-dark hover:border-gold hover:bg-gold/10 transition-all duration-300">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-charcoal/60 bg-gold/10 p-3.5 rounded-xl border border-gold/20 flex items-center gap-2 max-w-sm">
            <ShieldCheck size={14} className="text-gold-dark shrink-0" />
            <span>100% Anti-tarnish &amp; skin-friendly jewelry for lovers of elegance in India 🇮🇳</span>
          </div>
        </div>

        {/* Column: Collections */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold-dark font-semibold mb-4 flex items-center gap-1.5">
            <span>Explore Shop</span>
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-charcoal/75">
            <li>
              <Link to="/collections" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>All Collections</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold-dark font-medium border border-gold/30">NEW</span>
              </Link>
            </li>
            <li>
              <Link to="/best-sellers" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Best Sellers</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium border border-amber-300">HOT</span>
              </Link>
            </li>
            <li>
              <Link to="/occasion" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Occasion Edit</span>
              </Link>
            </li>
            <li>
              <Link to="/collections/necklace" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Fine Necklaces</span>
              </Link>
            </li>
            <li>
              <Link to="/collections/earrings" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Royal Earrings</span>
              </Link>
            </li>
            <li>
              <Link to="/collections/rings" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Rings &amp; Bracelets</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column: Customer Care */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold-dark font-semibold mb-4 flex items-center gap-1.5">
            <span>Customer Care</span>
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-charcoal/75">
            <li>
              <Link to="/orders" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Track Your Order</span>
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Shipping Policy</span>
              </Link>
            </li>
            <li>
              <Link to="/returns-refunds" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link to="/terms-conditions" className="hover:text-gold-dark transition-colors inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                <span>Terms &amp; Conditions</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column: Bespoke Concierge */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-gold-dark font-semibold mb-4 flex items-center gap-1.5">
            <span>Get in Touch</span>
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-charcoal/75">
            {ADMIN_WHATSAPP_NUMBER && (
              <li>
                <a
                  href={buildWhatsAppLink(ADMIN_WHATSAPP_NUMBER, "Hi Glimmora! I have a question about your products.")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-700 transition-colors p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-emerald-900 group"
                >
                  <MessageCircle size={16} className="text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col text-xs">
                    <span className="font-medium">WhatsApp Concierge</span>
                    <span className="text-[10px] text-emerald-700/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Chat Available
                    </span>
                  </div>
                </a>
              </li>
            )}

            <li>
              <a
                href={`mailto:${GLIMMORA_EMAIL}`}
                className="flex items-center gap-2 hover:text-gold-dark transition-colors p-2 rounded-lg bg-white border border-gold/20 break-all text-xs"
              >
                <Mail size={15} className="text-gold-dark shrink-0" />
                <span>{GLIMMORA_EMAIL}</span>
              </a>
            </li>

            <li className="pt-2 text-xs text-charcoal/60 space-y-1 font-light">
              <p className="font-medium text-charcoal">Concierge Hours:</p>
              <p>Mon – Sat: 10:00 AM – 7:00 PM IST</p>
              <p>Sun: Off (Online Orders 24/7)</p>
            </li>
          </ul>
        </div>
      </div>



      {/* 5. Luxury Watermark Signature & Copyright */}
      <div className="py-12 border-t border-gold/15 flex flex-col items-center justify-center bg-gradient-to-b from-white/40 to-ivory relative overflow-hidden">
        <Link to="/" className="group transition-transform duration-300 hover:scale-105 relative z-10">
          <img
            src={textLogo}
            alt="Glimmora Luxury Signature"
            className="h-16 md:h-24 w-auto object-contain mix-blend-multiply opacity-85 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-sm"
          />
        </Link>
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold-dark mt-3 font-medium relative z-10">
          The Aura of Elegance
        </p>

        {/* Back to top float */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-charcoal text-gold border border-gold/40 shadow-2xl flex items-center justify-center hover:bg-gold hover:text-charcoal transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <ArrowUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gold/15 bg-charcoal text-ivory/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div>© {year} Glimmora Jewels. All rights reserved.</div>
          <div className="flex items-center gap-4 text-ivory/50">
            <Link to="/privacy-policy" className="hover:text-gold transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms-conditions" className="hover:text-gold transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/shipping-policy" className="hover:text-gold transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

