import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';

export const FeaturedProducts = ({ onProductClick, onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        // Get first 6 products
        setProducts(data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading featured products...</p>
        </div>
      </section>
    );
  }

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    onAddToCart(product);
    toast.success(`${product.name} added to cart!`, {
      description: `₹${product.price?.toLocaleString()}`,
    });
  };

  const handleWishlist = async (e, product) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          category: product.category,
          image: product.images?.[0] || product.image,
          rating: product.rating || 4.5,
          reviews: product.reviews || 0
        })
      });

      if (response.ok) {
        toast.success('Added to wishlist!', {
          description: product.name,
        });
      } else {
        const error = await response.json();
        if (error.detail?.includes('already')) {
          toast.info('Already in your wishlist');
        } else {
          toast.error('Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Error adding to wishlist');
    }
  };

  return (
    <section className="py-20 bg-background" id="best-sellers">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Featured Collection
          </h2>
          <div className="gold-divider mb-4" />
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Handpicked pieces that define luxury and elegance
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="card-luxury cursor-pointer group"
              onClick={() => onProductClick(product)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-square bg-muted">
                  <img
                    src={(product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://via.placeholder.com/400x400?text=' + encodeURIComponent(product.name))}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Stock Badge */}
                  {product.stock > 0 && (
                    <Badge
                      variant="default"
                      className="absolute top-4 left-4 z-10 bg-green-500"
                    >
                      In Stock
                    </Badge>
                  )}
                  {product.stock <= 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-4 left-4 z-10"
                    >
                      Out of Stock
                    </Badge>
                  )}
                      
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white hover:bg-primary hover:text-white transition-colors"
                      onClick={(e) => handleWishlist(e, product)}
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-primary hover:opacity-90"
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.stock <= 0}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white hover:bg-primary hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product);
                      }}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                    {product.category}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-base group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.description || 'Premium jewelry item'}
                  </p>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      ₹{product.price?.toFixed(2)}
                    </span>
                  </div>

                  {/* Stock Info */}
                  <div className="text-xs text-muted-foreground mt-2">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="btn-outline-gold">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;