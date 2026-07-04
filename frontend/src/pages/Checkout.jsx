import React, { useState } from 'react';
import { ArrowLeft, Truck, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';

export const Checkout = ({ cartItems, onBack, onOrderComplete, user }) => {
  const [step, setStep] = useState('shipping'); // shipping, review, whatsapp
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  
  const [shippingMethod, setShippingMethod] = useState('standard');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingMethod === 'express' ? 45 : (subtotal > 500 ? 0 : 25);
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const token = localStorage.getItem('ready2buy_token');

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep('review');
  };

  const handleSendViaWhatsApp = async () => {
    setLoading(true);
    try {
      // First, check stock availability for all items
      const itemsForStockCheck = cartItems.map(item => ({
        product_id: item.product_id || item.id,
        quantity: item.quantity
      }));
      
      console.log('Stock check items:', itemsForStockCheck);
      
      const stockCheckResponse = await fetch('http://localhost:8000/api/products/check-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemsForStockCheck)
      });

      let stockData;
      try {
        stockData = await stockCheckResponse.json();
      } catch (e) {
        console.error('Failed to parse stock check response:', e);
        throw new Error('Invalid response from stock check');
      }

      if (!stockCheckResponse.ok) {
        throw new Error(stockData.detail || 'Failed to check stock');
      }
      
      if (!stockData.all_in_stock) {
        const outOfStock = stockData.items.filter(item => !item.in_stock);
        const messages = outOfStock.map(item => 
          `${item.name}: ${item.available} available, ${item.requested} requested`
        ).join('\n');
        
        toast.error('Insufficient Stock', {
          description: messages
        });
        setLoading(false);
        return;
      }

      // Check for low stock items and warn user
      const lowStockItems = stockData.items.filter(item => item.low_stock && item.in_stock);
      if (lowStockItems.length > 0) {
        const lowStockMessage = lowStockItems.map(item => 
          `${item.name}: Only ${item.available} left`
        ).join(', ');
        
        toast.warning('Low Stock Alert', {
          description: lowStockMessage
        });
      }

      // Create the order in the database
      const orderData = {
        customer_email: user?.email || shippingInfo.email,
        items: cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category
        })),
        total: total,
        status: 'Processing',
        shipping_info: shippingInfo,
        order_method: 'whatsapp'
      };

      const createOrderResponse = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      let createdOrder;
      if (!createOrderResponse.ok) {
        try {
          const errorData = await createOrderResponse.json();
          throw new Error(errorData.detail || 'Failed to create order');
        } catch (parseError) {
          throw new Error(`Order creation failed with status ${createOrderResponse.status}`);
        }
      }
      
      try {
        createdOrder = await createOrderResponse.json();
      } catch (parseError) {
        console.error('Failed to parse successful order response:', parseError);
        throw new Error('Failed to parse order creation response');
      }

      const orderId = createdOrder.id;

      // Now send it via WhatsApp
      const whatsappResponse = await fetch(`http://localhost:8000/api/orders/${orderId}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let whatsappData;
      try {
        whatsappData = await whatsappResponse.json();
      } catch (e) {
        console.error('Failed to parse WhatsApp response:', e);
        throw new Error('Invalid response from WhatsApp endpoint');
      }

      if (!whatsappResponse.ok) {
        throw new Error(whatsappData.detail || 'Failed to send via WhatsApp');
      }

      // Open WhatsApp link if available
      if (whatsappData.whatsapp_link) {
        window.open(whatsappData.whatsapp_link, '_blank');
      }

      // Also save order to localStorage as backup (for offline viewing)
      const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: cartItems,
        total: total,
        status: 'WhatsApp Sent',
        order_method: 'whatsapp',
        shippingInfo,
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('ready2buy_orders') || '[]');
      localStorage.setItem('ready2buy_orders', JSON.stringify([order, ...existingOrders]));

      toast.success('Order sent via WhatsApp! Check your phone to confirm.', {
        description: 'The admin will contact you shortly with confirmation.',
      });

      // Clear cart immediately (don't wait for setTimeout)
      setTimeout(() => {
        onOrderComplete();
      }, 100);
    } catch (error) {
      console.error('Error sending order:', error);
      toast.error(error.message || 'Failed to send order via WhatsApp');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Checkout
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${
              step === 'shipping' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'shipping' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium hidden sm:inline">Shipping</span>
            </div>
            <div className="w-12 h-0.5 bg-border" />
            <div className={`flex items-center gap-2 ${
              step === 'review' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step === 'review' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">Review & Order</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Information */}
            {step === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={shippingInfo.fullName}
                          onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Shipping Method */}
                    <div>
                      <Label className="text-base mb-3 block">Shipping Method</Label>
                      <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg mb-2">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="flex-1 cursor-pointer">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">Standard Shipping</div>
                                <div className="text-xs text-muted-foreground">5-7 business days</div>
                              </div>
                              <div className="font-medium">
                                {subtotal > 500 ? 'FREE' : '₹25.00'}
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="flex-1 cursor-pointer">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">Express Shipping</div>
                                <div className="text-xs text-muted-foreground">2-3 business days</div>
                              </div>
                              <div className="font-medium">₹45.00</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button type="submit" size="lg" className="w-full btn-luxury mt-6">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {step === 'review' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Shipping Info Review */}
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        Shipping Address
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{shippingInfo.fullName}</p>
                        <p>{shippingInfo.address}</p>
                        <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                        <p>{shippingInfo.email}</p>
                        <p>{shippingInfo.phone}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {item.product_id || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* WhatsApp Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                        <MessageCircle className="h-4 w-4" />
                        Ordering via WhatsApp
                      </h3>
                      <p className="text-sm text-blue-800">
                        Your order details will be sent to our WhatsApp. We'll contact you to confirm and process your order.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep('shipping')}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 btn-luxury"
                    onClick={handleSendViaWhatsApp}
                    disabled={loading}
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Send via WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Information - OLD SECTION TO REPLACE */}
            {step === 'payment' && null}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;