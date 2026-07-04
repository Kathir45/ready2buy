import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export const Cart = ({ cartItems, onUpdateQuantity, onRemove }) => {
  const navigate = useNavigate();
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 25;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (item, newQuantity) => {
    if (item.stock && newQuantity > item.stock) {
      toast.error(`Cannot exceed available stock`, {
        description: `Only ${item.stock} items available for ${item.name}`
      });
      return;
    }
    onUpdateQuantity(item.id, newQuantity);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Your Cart is Empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button size="lg" className="btn-luxury" onClick={() => navigate('/products')}>
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {item.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs mb-2">
                            {item.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              disabled={item.stock && item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {item.stock && item.stock > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {item.stock} in stock
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ₹{item.price.toLocaleString()} each
                          </div>
                        </div>
                      </div>
                      
                      {/* Stock Warning */}
                      {item.stock <= 0 && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-semibold">
                          Out of Stock - Please remove from cart
                        </div>
                      )}
                      
                      {item.stock > 0 && item.stock <= 5 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-600 font-semibold">
                          ⚠️ Low Stock: Only {item.stock} left!
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <Badge variant="secondary" className="text-xs">Free</Badge>
                      ) : (
                        `₹${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  
                  {subtotal < 500 && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs text-primary">
                        Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full btn-luxury"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>

                <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Secure checkout
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    30-day return policy
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Authenticity guaranteed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;