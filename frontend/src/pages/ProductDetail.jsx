import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Heart, ShoppingCart, Shield, Truck, RefreshCw, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

export const ProductDetail = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product details on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // Fetch product by ID
        const productRes = await fetch(`http://localhost:8000/api/products/${id}`);
        if (!productRes.ok) {
          throw new Error('Product not found');
        }
        const productData = await productRes.json();
        setProduct(productData);
        
        // Fetch reviews for this product
        try {
          const reviewsRes = await fetch(`http://localhost:8000/api/products/${id}/reviews`);
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData);
          }
        } catch (error) {
          console.log('No reviews found for this product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>Product not found</p>
        <Button onClick={() => navigate('/products')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Use product images array, fallback to single image if not available
  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.image || 'https://via.placeholder.com/600x600?text=' + encodeURIComponent(product.name)];

  const handleAddToCart = () => {
    // Check stock availability
    if (!product.stock || product.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available in stock`, {
        description: `Quantity reduced to available stock`
      });
      setQuantity(product.stock);
      return;
    }
    
    // Add to cart with both id and product_id
    const productToAdd = {
      ...product,
      id: product.id,
      product_id: product.product_id || product.id
    };
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(productToAdd);
    }
    toast.success(`${quantity} ${product.name} added to cart!`);
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to add to wishlist', {
        description: 'Sign in to save items for later'
      });
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
          product_id: product.product_id || product.id,
          product_name: product.name,
          price: product.price,
          category: product.category,
          image: product.images?.[0] || product.image || 'https://via.placeholder.com/300',
          rating: product.rating || 4.5,
          reviews: product.reviews || 0
        })
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse wishlist response:', parseError, 'Status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to add to wishlist');
        }
        // If ok but can't parse, still show success
        toast.success('Added to wishlist!', {
          description: `${product.name} saved to your wishlist`
        });
        return;
      }

      if (response.ok) {
        toast.success('Added to wishlist!', {
          description: `${product.name} saved to your wishlist`
        });
      } else {
        if (responseData.detail?.includes('already')) {
          toast.info('Already in wishlist', {
            description: 'This item is already in your wishlist'
          });
        } else {
          toast.error('Failed to add to wishlist', {
            description: responseData.detail || 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Error adding to wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        {/* Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-3 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category & Badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
              {product.badge && (
                <Badge variant="outline" className="text-xs">
                  {product.badge}
                </Badge>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating || 0} ({reviews?.length || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    Save ₹{(product.originalPrice - product.price).toLocaleString()}
                  </Badge>
                </>
              )}
            </div>

            <Separator className="my-6" />

            {/* Description */}
            <div className="mb-6">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || `Exquisite craftsmanship meets timeless design in this stunning piece. 
                Handcrafted with premium materials and attention to every detail, this 
                ${product.category.toLowerCase()} embodies luxury and elegance. Perfect for 
                special occasions or everyday sophistication.`}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10"
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                  className="h-10 w-10"
                  disabled={quantity >= (product.stock || 0)}
                >
                  +
                </Button>
              </div>
              {product.stock && product.stock > 0 && (
                <span className="text-sm text-muted-foreground">
                  {product.stock} in stock
                </span>
              )}
            </div>

            {/* Stock Warning */}
            {product.stock <= 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-red-700 text-sm">
                <p className="font-semibold">Out of Stock</p>
                <p className="text-xs">This item is currently unavailable</p>
              </div>
            )}
            
            {product.stock > 0 && product.stock <= 5 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-amber-700 text-sm">
                <p className="font-semibold">⚠️ Low Stock</p>
                <p className="text-xs">Only {product.stock} item{product.stock > 1 ? 's' : ''} left! Order now to avoid missing out.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                size="lg"
                className="btn-luxury flex-1"
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock <= 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-outline-gold"
                onClick={handleWishlist}
              >
                <Heart className="mr-2 h-5 w-5" />
                Wishlist
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Free Shipping</div>
                  <div className="text-xs text-muted-foreground">On orders over ₹500</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Easy Returns</div>
                  <div className="text-xs text-muted-foreground">30-day return policy</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Secure Payment</div>
                  <div className="text-xs text-muted-foreground">100% secure checkout</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Authenticity</div>
                  <div className="text-xs text-muted-foreground">Certified genuine</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="care">Care</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Product Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Product ID:</span>
                      <span className="font-medium">{product.id?.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">₹{product.price?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className="font-medium">{product.stock} units available</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="care" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Care Instructions</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>• Clean regularly with a soft, lint-free cloth</p>
                    <p>• Store in a dry place away from direct sunlight</p>
                    <p>• Avoid contact with chemicals, perfumes, and lotions</p>
                    <p>• Remove before swimming or showering</p>
                    <p>• Professional cleaning recommended annually</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Customer Reviews</h3>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review, index) => (
                        <div key={index} className="pb-6 border-b last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < (review.rating || 5) 
                                      ? 'fill-primary text-primary' 
                                      : 'text-muted-foreground'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.title || 'Verified Purchase'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            "{review.comment || review.text}"
                          </p>
                          <p className="text-xs text-muted-foreground">- {review.customerName || 'Customer'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;