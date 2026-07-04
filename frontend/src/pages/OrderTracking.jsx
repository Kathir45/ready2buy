import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';

const OrderTracking = ({ user, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load orders from backend
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('ready2buy_token');
      
      if (!token) {
        toast.error('Please login to view order tracking');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const ordersData = await response.json();
          setOrders(ordersData);
          if (ordersData.length > 0) {
            setSelectedOrder(ordersData[0]);
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = orders.filter(order =>
      order.id.toLowerCase().includes(term) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(term))
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const getStatusSteps = (status) => {
    const steps = [
      { label: 'Order Placed', icon: Package, key: 'placed' },
      { label: 'Processing', icon: Clock, key: 'processing' },
      { label: 'Shipped', icon: Truck, key: 'shipped' },
      { label: 'Delivered', icon: CheckCircle, key: 'delivered' }
    ];

    const statusMap = {
      'Processing': 1,
      'WhatsApp Sent': 1,
      'Confirmed': 1,
      'Shipped': 2,
      'Delivered': 3,
      'Cancelled': -1,
    };

    const currentStep = statusMap[status] || 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStep,
      active: index === currentStep,
      disabled: index > currentStep
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'Processing': 'warning',
      'WhatsApp Sent': 'secondary',
      'Confirmed': 'secondary',
      'Shipped': 'secondary',
      'Delivered': 'default',
      'Cancelled': 'destructive',
    };
    return colors[status] || 'default';
  };

  const getStatusProgress = (status) => {
    const progressMap = {
      'Processing': 25,
      'WhatsApp Sent': 25,
      'Confirmed': 50,
      'Shipped': 75,
      'Delivered': 100,
      'Cancelled': 0,
    };
    return progressMap[status] || 0;
  };

  const getEstimatedDeliveryDate = (order) => {
    if (order.status === 'Delivered' && order.cancelled_at) {
      return new Date(order.cancelled_at).toLocaleDateString();
    }
    
    const orderDate = new Date(order.date);
    const estimatedDate = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    return estimatedDate.toLocaleDateString();
  };

  const TimelineStep = ({ step, order }) => {
    const Icon = step.icon;
    const isCompleted = step.completed;
    const isActive = step.active;

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              order.status === 'Cancelled'
                ? 'bg-red-100'
                : isCompleted
                ? 'bg-green-100'
                : isActive
                ? 'bg-blue-100'
                : 'bg-gray-100'
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                order.status === 'Cancelled'
                  ? 'text-red-600'
                  : isCompleted
                  ? 'text-green-600'
                  : isActive
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            />
          </div>
        </div>
        <div className="text-xs font-medium text-center mt-2 text-muted-foreground">
          {step.label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Track Your Orders</h1>
        <p className="text-muted-foreground mb-8">
          Monitor your order status in real-time
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Order List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search order ID..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Orders List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Loading orders...</div>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-muted-foreground text-sm">No orders found</div>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedOrder?.id === order.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">{order.id}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getStatusColor(order.status)} className="text-xs">
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold">₹{order.total.toFixed(2)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Status Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <CardTitle>Order #{selectedOrder.id}</CardTitle>
                        <CardDescription>
                          Ordered on {new Date(selectedOrder.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm">
                        {selectedOrder.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    {selectedOrder.status !== 'Cancelled' ? (
                      <div className="mb-6">
                        <Progress value={getStatusProgress(selectedOrder.status)} className="h-2" />
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900">Order Cancelled</p>
                            {selectedOrder.cancellation_reason && (
                              <p className="text-xs text-red-700 mt-1">
                                Reason: {selectedOrder.cancellation_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedOrder.status !== 'Cancelled' && (
                      <div className="flex justify-between items-start">
                        {getStatusSteps(selectedOrder.status).map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center flex-1">
                            <TimelineStep step={step} order={selectedOrder} />
                            {idx < getStatusSteps(selectedOrder.status).length - 1 && (
                              <div
                                className={`h-1 w-full mt-4 ${
                                  step.completed ? 'bg-green-600' : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estimated Delivery */}
                {selectedOrder.status !== 'Cancelled' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Delivery Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Estimated Delivery</span>
                          <span className="text-sm font-bold text-primary">
                            {getEstimatedDeliveryDate(selectedOrder)}
                          </span>
                        </div>
                        {selectedOrder.status === 'Delivered' && selectedOrder.cancelled_at && (
                          <div className="text-xs text-muted-foreground">
                            Delivered on {new Date(selectedOrder.cancelled_at).toLocaleDateString()}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Your order will typically be delivered within 5-7 business days from the shipping date.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {item.product_id || 'N/A'} | Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Details */}
                {selectedOrder.shipping_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">
                          {selectedOrder.shipping_info.fullName}
                        </p>
                        <p className="text-muted-foreground">
                          {selectedOrder.shipping_info.address}
                        </p>
                        <p className="text-muted-foreground">
                          {selectedOrder.shipping_info.city}, {selectedOrder.shipping_info.state} {selectedOrder.shipping_info.zipCode}
                        </p>
                        <p className="text-muted-foreground">
                          {selectedOrder.shipping_info.country}
                        </p>
                        {selectedOrder.shipping_info.phone && (
                          <p className="text-muted-foreground flex items-center gap-2 mt-3">
                            <Phone className="h-4 w-4" />
                            {selectedOrder.shipping_info.phone}
                          </p>
                        )}
                        {selectedOrder.shipping_info.email && (
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedOrder.shipping_info.email}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total Amount</span>
                        <span className="text-primary">₹{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Order Method: {selectedOrder.order_method === 'whatsapp' ? 'WhatsApp' : 'Online'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select an order to view tracking details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
