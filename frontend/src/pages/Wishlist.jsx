import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, ShoppingCart, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export const Wishlist = ({ onProductClick, onAddToCart }) => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef(0);

  // Fetch wishlist from backend - refetch each time page is visited
  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem('ready2buy_token');
      
      if (!token) {
        // If no token, user not logged in
        setLoading(false);
        setWishlistItems([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data || []);
          lastFetchRef.current = Date.now();
        } else {
          console.error('Failed to fetch wishlist');
          setWishlistItems([]);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadWishlist();
  }, [navigate]);

  const handleRemoveFromWishlist = async (itemId) => {
    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to manage wishlist');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
        toast.success('Removed from wishlist');
      } else {
        toast.error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Error removing from wishlist');
    }
  };

  const handleAddToCart = (product) => {
    onAddToCart(product);
    toast.success('Added to cart!');
  };

  const handleAddAllToCart = async () => {
    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to add to cart');
      return;
    }

    // Fetch current product stock status
    try {
      let inStockItems = 0;
      for (const item of wishlistItems) {
        // Fetch product details to check stock
        const res = await fetch(`http://localhost:8000/api/products/${item.product_id}`);
        if (res.ok) {
          const product = await res.json();
          if (product.stock > 0) {
            onAddToCart({ ...item, stock: product.stock });
            inStockItems++;
          }
        }
      }
      
      if (inStockItems > 0) {
        toast.success(`Added ${inStockItems} items to cart!`);
      } else {
        toast.error('No items in stock');
      }
    } catch (error) {
      console.error('Error adding items to cart:', error);
      toast.error('Error adding items to cart');
    }
  };

  const filteredItems = wishlistItems.filter(item =>
    (item.name || item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);
  const inStockCount = wishlistItems.filter(item => item.inStock).length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Heart className="h-10 w-10 text-luxury-gold fill-luxury-gold" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground">
                {wishlistItems.length} items saved · Total value: ₹{totalValue.toFixed(2)}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {wishlistItems.length > 0 && (
                <Button
                  className="btn-luxury"
                  onClick={handleAddAllToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add All to Cart ({wishlistItems.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        {wishlistItems.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Wishlist Content */}
        {loading ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground">Loading your wishlist...</p>
            </CardContent>
          </Card>
        ) : !wishlistItems.length ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Your Wishlist is Empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Save items you love by clicking the heart icon on products
              </p>
              <Button className="btn-luxury" onClick={() => navigate('/products')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                No items found
              </h2>
              <p className="text-muted-foreground mb-6">
                Try searching with different keywords
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <WishlistCard 
                key={item.id} 
                item={item} 
                onProductClick={onProductClick}
                onAddToCart={handleAddToCart}
                onRemove={handleRemoveFromWishlist}
              />
            ))}
          </div>
        )}

        {/* Tips Section */}
        {wishlistItems.length > 0 && (
          <Card className="mt-12 bg-gradient-to-r from-luxury-gold/10 to-luxury-blue/10">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-2">💡 Pro Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Share your wishlist with friends and family for gift ideas</li>
                <li>• Items are updated in real-time with latest prices</li>
                <li>• Remove items you no longer want with the trash icon</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const WishlistCard = ({ item, onProductClick, onAddToCart, onRemove }) => {
  const [inStock, setInStock] = useState(true);
  const [productStock, setProductStock] = useState(null);

  useEffect(() => {
    // Fetch product stock status in real-time
    const checkStock = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/products/${item.product_id}`);
        if (response.ok) {
          const product = await response.json();
          setProductStock(product.stock);
          setInStock(product.stock > 0);
        }
      } catch (error) {
        console.error('Error checking stock:', error);
      }
    };
    
    checkStock();
  }, [item.product_id]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
          onClick={() => onProductClick(item)}
        />
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        >
          <Heart className="h-5 w-5 text-luxury-gold fill-luxury-gold" />
        </button>
        {!inStock && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Out of Stock
          </Badge>
        )}
        {item.added_date && (
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            Added {new Date(item.added_date).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        </div>
        
        <h3 
          className="font-semibold text-lg text-foreground mb-2 hover:text-luxury-gold cursor-pointer transition-colors line-clamp-2"
          onClick={() => onProductClick(item)}
        >
          {item.product_name}
        </h3>
        
        {item.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(item.rating) ? "text-luxury-gold" : "text-gray-300"}>
                  ★
                </span>
              ))}
            </div>
            {item.reviews && (
              <span className="text-sm text-muted-foreground">
                ({item.reviews})
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-luxury-gold">
            ₹{item.price}
          </span>
          {productStock !== null && (
            <span className="text-xs text-muted-foreground">
              {productStock} in stock
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            className="flex-1 btn-luxury"
            onClick={() => onAddToCart(item)}
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Wishlist;
