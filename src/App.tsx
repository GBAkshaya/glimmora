import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Collections from './pages/Collections'
import Occasion from './pages/Occasion'
import BestSellers from './pages/BestSellers'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import Login from './pages/Login'
import MyOrders from './pages/MyOrders'
import Account from './pages/Account'
import ShippingPolicy from './pages/ShippingPolicy'
import ReturnsRefunds from './pages/ReturnsRefunds'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminHomeContent from './pages/admin/AdminHomeContent'
import AdminPaymentSettings from './pages/admin/AdminPaymentSettings'
import AdminVipSubscribers from './pages/admin/AdminVipSubscribers'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:categorySlug" element={<Collections />} />
        <Route path="/occasion" element={<Occasion />} />
        <Route path="/occasion/:section" element={<Occasion />} />
        <Route path="/best-sellers" element={<BestSellers />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/account" element={<Account />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/returns-refunds" element={<ReturnsRefunds />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Route>

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products/:id" element={<AdminProductForm />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/vip-subscribers" element={<AdminVipSubscribers />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/admin/home-content" element={<AdminHomeContent />} />
        <Route path="/admin/payment-settings" element={<AdminPaymentSettings />} />
      </Route>
    </Routes>
  )
}

export default App
