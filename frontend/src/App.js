import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import FeaturedProducts from './components/FeaturedProducts';
import Collections from './components/Collections';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Products from './pages/Products';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import OrderTracking from './pages/OrderTracking';

// Protected Route Component
const ProtectedRoute = ({ element, user, navigate }) => {
  if (!user) {
    navigate('/login');
    return null;
  }
  return element;
};

// Home Page Component
const HomePage = ({ onProductClick, addToCart }) => {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts 
        onProductClick={onProductClick}
        onAddToCart={addToCart}
      />
      <Collections />
      <Testimonials />
      <Newsletter />
    </>
  );
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    // Initialize from localStorage immediately
    const savedCart = localStorage.getItem('ready2buy_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ready2buy_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      // Check if user is admin
      if (userData.is_admin) {
        setIsAdmin(true);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ready2buy_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    navigate('/product/' + product.id);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('ready2buy_user', JSON.stringify(userData));
    // Check if user is admin
    if (userData.is_admin) {
      setIsAdmin(true);
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ready2buy_user');
    setIsAdmin(false);
    navigate('/');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  // If user is admin, show only admin dashboard
  if (isAdmin && user) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="*" element={
            <AdminDashboard 
              onLogout={handleLogout}
            />
          } />
        </Routes>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAdminRoute && (
        <Header 
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          user={user}
        />
      )}
      
      <main>
        <Routes>
          <Route path="/" element={
            <HomePage 
              onProductClick={handleProductClick}
              addToCart={addToCart}
            />
          } />
          
          <Route path="/login" element={
            <Login
              onLogin={handleLogin}
            />
          } />
          
          <Route path="/products" element={
            user ? (
              <Products
                onProductClick={handleProductClick}
                onAddToCart={addToCart}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/product/:id" element={
            user ? (
              <ProductDetail
                onAddToCart={addToCart}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/cart" element={
            user ? (
              <Cart
                cartItems={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/checkout" element={
            user ? (
              <Checkout
                cartItems={cartItems}
                user={user}
                onBack={() => navigate('/cart')}
                onOrderComplete={() => {
                  setCartItems([]);
                  navigate('/track-orders');
                }}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/profile" element={
            user ? (
              <UserProfile
                user={user}
                onBack={() => navigate('/')}
                onLogout={handleLogout}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/track-orders" element={
            user ? (
              <OrderTracking 
                user={user}
                onBack={() => navigate('/profile')}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/wishlist" element={
            user ? (
              <Wishlist
                onProductClick={handleProductClick}
                onAddToCart={addToCart}
              />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/about" element={
            user ? (
              <About />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
          
          <Route path="/contact" element={
            user ? (
              <Contact />
            ) : (
              (() => {
                navigate('/login');
                return null;
              })()
            )
          } />
        </Routes>
      </main>
      
      {!isAdminRoute && <Footer />}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;