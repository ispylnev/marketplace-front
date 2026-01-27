import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
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

// Layout компонент для страниц с Header/Footer
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
      <Routes>
        {/* Страницы без Header/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-store" element={<RegisterStore />} />
        
        {/* Страницы с Header/Footer */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/catalog" element={<Layout><Catalog /></Layout>} />
        <Route path="/catalog/:categorySlug" element={<Layout><Catalog /></Layout>} />
        <Route path="/product/:slugWithId" element={<Layout><ProductDetail /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/profile/buyer" element={<BuyerProfile />} />
        <Route path="/seller/:slugWithId" element={<SellerProfile />} />
        <Route path="/seller/admin" element={<SellerAdmin />} />
        <Route path="/seller/offers/new" element={<CreateOffer />} />
        <Route path="/seller/offers/:id/edit" element={<EditOffer />} />
        <Route path="/seller/moderation" element={<SellerModeration />} />
        
        {/* Административная панель (модераторы/админы) */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
