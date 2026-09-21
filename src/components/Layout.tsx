import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import CookieConsent from './CookieConsent'
import { scrollToY, startSmoothScroll, stopSmoothScroll } from '../lib/smoothScroll'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  // The homepage runs dark from the scroll story to the footer. Set on <html>
  // (before paint) so the page background, overscroll area and every themed
  // token switch together; index.html sets it early too to avoid a light flash.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('theme-noir', isHome)
  }, [isHome])
  useEffect(() => () => document.documentElement.classList.remove('theme-noir'), [])

  useEffect(() => {
    startSmoothScroll()
    return stopSmoothScroll
  }, [])

  // A new page should open at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    scrollToY(0, { immediate: true })
  }, [pathname])

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  )
}
