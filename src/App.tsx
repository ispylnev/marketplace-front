import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BuyerProfile from './pages/BuyerProfile';
import SellerProfile from './pages/SellerProfile';
import SellerAdmin from './pages/SellerAdmin';
import SellerModeration from './pages/SellerModeration';
import RegisterStore from './pages/RegisterStore';
import AdminPanel from './pages/AdminPanel';
import CreateOffer from './pages/CreateOffer';
import EditOffer from './pages/EditOffer';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';

// Layout with Header/Footer
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
        <ToastProvider>
          <Routes>
            {/* Guest routes (redirect if authenticated) */}
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />

            {/* Public routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
            <Route path="/catalog/:categorySlug" element={<Layout><Catalog /></Layout>} />
            <Route path="/product/:slugWithId" element={<Layout><ProductDetail /></Layout>} />
            <Route path="/seller/:slugWithId" element={<SellerProfile />} />

            {/* Protected routes (auth required) */}
            <Route path="/favorites" element={
              <ProtectedRoute authOnly>
                <Layout><Favorites /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute authOnly>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute authOnly>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute authOnly>
                <MyOrders />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute authOnly>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile/buyer" element={
              <ProtectedRoute authOnly>
                <BuyerProfile />
              </ProtectedRoute>
            } />
            <Route path="/register-store" element={
              <ProtectedRoute authOnly>
                <RegisterStore />
              </ProtectedRoute>
            } />

            {/* Seller routes */}
            <Route path="/seller/admin" element={
              <ProtectedRoute requiredRole="ROLE_SELLER">
                <SellerAdmin />
              </ProtectedRoute>
            } />
            <Route path="/seller/offers/new" element={
              <ProtectedRoute requiredRole="ROLE_SELLER">
                <CreateOffer />
              </ProtectedRoute>
            } />
            <Route path="/seller/offers/:id/edit" element={
              <ProtectedRoute requiredRole="ROLE_SELLER">
                <EditOffer />
              </ProtectedRoute>
            } />
            <Route path="/seller/moderation" element={
              <ProtectedRoute requiredRole="ROLE_SELLER">
                <SellerModeration />
              </ProtectedRoute>
            } />

            {/* Admin/Moderator routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MODERATOR']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Routes>
        </ToastProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
