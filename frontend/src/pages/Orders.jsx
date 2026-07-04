import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Search, Eye, MessageCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const mockOrders = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 299.97,
    items: [
      {
        name: 'Premium Leather Wallet',
        quantity: 1,
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200'
      },
      {
        name: 'Wireless Headphones',
        quantity: 1,
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'
      }
    ],
    tracking: 'TRK123456789',
    shippingAddress: '123 Main St, New York, NY 10001'
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-20',
    status: 'shipped',
    total: 249.99,
    items: [
      {
        name: 'Minimalist Watch',
        quantity: 1,
        price: 249.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
      }
    ],
    tracking: 'TRK987654321',
    estimatedDelivery: '2024-01-25',
    shippingAddress: '123 Main St, New York, NY 10001'
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-22',
    status: 'processing',
    total: 369.97,
    items: [
      {
        name: 'Designer Sunglasses',
        quantity: 1,
        price: 159.99,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200'
      },
      {
        name: 'Canvas Backpack',
        quantity: 1,
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200'
      },
      {
        name: 'Smart Fitness Tracker',
        quantity: 1,
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=200'
      }
    ],
    shippingAddress: '123 Main St, New York, NY 10001'
  },
  {
    id: 'ORD-2024-004',
    date: '2024-01-10',
    status: 'cancelled',
    total: 189.99,
    items: [
      {
        name: 'Leather Messenger Bag',
        quantity: 1,
        price: 189.99,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200'
      }
    ],
    shippingAddress: '123 Main St, New York, NY 10001'
  }
];

export const Orders = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  // Handle order cancellation by user
  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to cancel order');
      return;
    }

    try {
      const order = orders.find(o => o.id === cancellingOrderId);
      const response = await fetch(`http://localhost:8000/api/orders/${cancellingOrderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...order,
          status: 'Cancelled',
          cancellation_reason: cancellationReason,
          cancelled_by: 'user',
          cancelled_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Reload orders
      const updatedOrdersRes = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (updatedOrdersRes.ok) {
        const ordersData = await updatedOrdersRes.json();
        setOrders(ordersData);
      }

      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      setCancellingOrderId(null);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  // Handle return request
  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for the return');
      return;
    }

    const token = localStorage.getItem('ready2buy_token');
    if (!token) {
      toast.error('Please login to request return');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/orders/${returningOrderId}/request-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: returnReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to request return');
      }

      // Reload orders
      const updatedOrdersRes = await fetch('http://localhost:8000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (updatedOrdersRes.ok) {
        const ordersData = await updatedOrdersRes.json();
        setOrders(ordersData);
      }

      toast.success('Return request submitted successfully');
      setReturnDialogOpen(false);
      setReturningOrderId(null);
      setReturnReason('');
    } catch (error) {
      console.error('Error requesting return:', error);
      toast.error(error.message || 'Failed to request return');
    }
  };

  // Check if return window is open (7 days after delivery)
  const isReturnWindowOpen = (order) => {
    if (order.status !== 'Delivered') {
      console.log(`Order ${order.id}: status is ${order.status}, not Delivered`);
      return false;
    }
    if (!order.delivered_at) {
      console.log(`Order ${order.id}: no delivered_at field`);
      return false;
    }
    
    const deliveredDate = new Date(order.delivered_at);
    const now = new Date();
    const daysPassed = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
    
    console.log(`Order ${order.id}: delivered_at=${order.delivered_at}, daysPassed=${daysPassed}, return_requested=${order.return_requested}`);
    
    const isOpen = daysPassed <= 7 && !order.return_requested;
    console.log(`Order ${order.id}: isReturnWindowOpen=${isOpen}`);
    return isOpen;
  };

  // Fetch orders on mount
  React.useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem('ready2buy_token');
      
      if (!token) {
        // If no token, try loading from localStorage as fallback
        const storedOrders = JSON.parse(localStorage.getItem('ready2buy_orders') || '[]');
        setOrders(storedOrders);
        setLoading(false);
        return;
      }

      try {
        // Fetch orders from backend
        const response = await fetch('http://localhost:8000/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const ordersData = await response.json();
          console.log('Orders fetched from backend:', ordersData);
          setOrders(ordersData);
        } else {
          console.log('API response not ok:', response.status, response.statusText);
          // Fallback to localStorage
          const storedOrders = JSON.parse(localStorage.getItem('ready2buy_orders') || '[]');
          console.log('Falling back to localStorage orders:', storedOrders);
          setOrders(storedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to localStorage
        const storedOrders = JSON.parse(localStorage.getItem('ready2buy_orders') || '[]');
        console.log('Falling back to localStorage due to error:', storedOrders);
        setOrders(storedOrders);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'whatsapp sent':
        return MessageCircle;
      case 'processing':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'whatsapp sent':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status?.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const OrderDetails = ({ order }) => (
    <div className="space-y-6">
      {console.log('Rendering order details for:', order)}
      {/* Order Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Order Status</h3>
          <p className="text-sm text-muted-foreground">{order.id}</p>
        </div>
        <Badge className={`${getStatusColor(order.status)} text-white`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <Separator />

      {/* Items */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Items</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-foreground">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Shipping Info */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Shipping Information</h3>
        <p className="text-sm text-muted-foreground mb-1">{order.shippingAddress}</p>
        {order.tracking && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Tracking: <span className="font-mono font-medium text-foreground">{order.tracking}</span>
            </p>
          </div>
        )}
        {order.estimatedDelivery && (
          <p className="text-sm text-muted-foreground mt-1">
            Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
          </p>
        )}
      </div>

      <Separator />

      {/* Cancellation Reason */}
      {order.status === 'Cancelled' && order.cancellation_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Order Cancelled</h4>
              <p className="text-sm text-red-700 mb-1">
                <strong>Reason:</strong> {order.cancellation_reason}
              </p>
              {order.cancelled_by && (
                <p className="text-xs text-red-600">
                  Cancelled by: {order.cancelled_by === 'user' ? 'You' : 'Admin'}
                  {order.cancelled_at && ` on ${new Date(order.cancelled_at).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {order.status === 'Cancelled' && order.cancellation_reason && <Separator />}

      {/* Return Request Info */}
      {order.return_requested && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Return Request</h4>
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Status:</strong> {order.return_status || 'Pending'}
                </p>
                <p className="text-sm text-blue-700 mb-1">
                  <strong>Reason:</strong> {order.return_reason}
                </p>
                {order.admin_return_notes && (
                  <p className="text-sm text-blue-700">
                    <strong>Admin Notes:</strong> {order.admin_return_notes}
                  </p>
                )}
                {order.return_requested_at && (
                  <p className="text-xs text-blue-600 mt-2">
                    Requested on {new Date(order.return_requested_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Order Total */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">₹{order.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">₹0.00</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span className="text-luxury-gold">₹{order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      {order.status === 'Delivered' && (
        <div className="flex flex-col gap-2">
          <Button className="w-full btn-luxury">
            Write a Review
          </Button>
          {isReturnWindowOpen(order) && (
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setReturningOrderId(order.id);
                    setReturnDialogOpen(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Return (7 Days)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Return</DialogTitle>
                  <DialogDescription>
                    Tell us why you want to return this order. You have 7 days from delivery to request a return.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="return-reason" className="text-foreground mb-2 block">
                      Reason for Return
                    </Label>
                    <Textarea
                      id="return-reason"
                      placeholder="Please describe the reason for your return request..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setReturnDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 btn-luxury"
                      onClick={handleRequestReturn}
                    >
                      Submit Return Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      {order.status === 'shipped' && (
        <Button className="w-full" variant="outline">
          Track Package
        </Button>
      )}
      {(order.status === 'Processing' || order.status === 'WhatsApp Sent' || order.status === 'Confirmed') && (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={() => {
                setCancellingOrderId(order.id);
                setCancelDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling your order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancel-reason" className="text-foreground mb-2 block">
                  Reason for Cancellation
                </Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Tell us why you want to cancel this order..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Keep Order
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  const OrderCard = ({ order }) => {
    const StatusIcon = getStatusIcon(order.status);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Order Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {order.id}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ordered on {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>

              {/* Items Preview */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-luxury-gold">
                    ₹{order.total.toFixed(2)}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Order Details</DialogTitle>
                      <DialogDescription>
                        Complete information about your order
                      </DialogDescription>
                    </DialogHeader>
                    <OrderDetails order={order} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                My Orders
              </h1>
              <p className="text-muted-foreground">
                Track and manage your orders
              </p>
            </div>
            
            {/* Track Orders Button */}
            <Button 
              onClick={() => navigate('/track-orders')}
              className="btn-luxury"
            >
              <Truck className="h-4 w-4 mr-2" />
              Track Orders
            </Button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-96 mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by order ID or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="whatsapp sent">WhatsApp Sent</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Loading your orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Orders Found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedStatus !== 'all'
                  ? 'No orders match your search criteria.'
                  : "You haven't placed any orders yet."}
              </p>
              {!searchQuery && selectedStatus === 'all' && (
                <Button className="btn-luxury" onClick={() => navigate('/products')}>
                  Start Shopping
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please explain why you're cancelling this order..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelDialogOpen(false);
                setCancellationReason('');
                setCancellingOrderId(null);
              }}
            >
              Keep Order
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={!cancellationReason.trim()}
            >
              Cancel Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
