import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Package, ShoppingCart, DollarSign, TrendingUp, Users, Plus, Edit, Trash2, Search, LogOut, X, Upload, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export const AdminDashboard = ({ onBack, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    product_id: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    images: []
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [returnStatusDialogOpen, setReturnStatusDialogOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnStatusValue, setReturnStatusValue] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Get auth token from localStorage
  const token = localStorage.getItem('ready2buy_token');

  // Fetch data on component mount
  useEffect(() => {
    if (!token) {
      toast.error('Admin access required. Please login first.');
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // Fetch products
      const productsRes = await fetch('http://localhost:8000/api/products', { headers });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      } else {
        console.error('Products error:', await productsRes.text());
        toast.error('Failed to load products');
      }

      // Fetch orders
      const ordersRes = await fetch('http://localhost:8000/api/orders', { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      } else {
        console.error('Orders error:', await ordersRes.text());
        toast.error('Failed to load orders');
      }

      // Fetch customers
      const customersRes = await fetch('http://localhost:8000/api/customers', { headers });
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData);
      } else {
        console.error('Customers error:', await customersRes.text());
        toast.error('Failed to load customers');
      }

      // Fetch return requests
      const returnRes = await fetch('http://localhost:8000/api/admin/return-requests', { headers });
      if (returnRes.ok) {
        const returnData = await returnRes.json();
        setReturnRequests(returnData);
      } else {
        console.error('Return requests error:', await returnRes.text());
        // Don't error if endpoint not available in earlier versions
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image file selection
  const handleImageUpload = async (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 5 images total
    const targetProduct = isEdit ? editingProduct : newProduct;
    const currentImages = targetProduct.images || [];
    const remainingSlots = 5 - currentImages.length;

    if (remainingSlots <= 0) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    try {
      const base64Images = await Promise.all(filesToAdd.map(file => fileToBase64(file)));
      
      if (isEdit) {
        setEditingProduct({
          ...editingProduct,
          images: [...(editingProduct.images || []), ...base64Images]
        });
      } else {
        setNewProduct({
          ...newProduct,
          images: [...(newProduct.images || []), ...base64Images]
        });
      }
      
      toast.success(`${filesToAdd.length} image(s) added`);
    } catch (error) {
      console.error('Error converting image:', error);
      toast.error('Failed to upload image');
    }
  };

  // Remove image from array
  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditingProduct({
        ...editingProduct,
        images: editingProduct.images.filter((_, i) => i !== index)
      });
    } else {
      setNewProduct({
        ...newProduct,
        images: newProduct.images.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.product_id || !newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      toast.error('Please fill in all required fields including Product ID');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: newProduct.product_id,
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          description: newProduct.description,
          image: newProduct.image,
          images: newProduct.images || []
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add product');
      }

      await fetchData();
      setNewProduct({ product_id: '', name: '', category: '', price: '', stock: '', description: '', image: '', images: [] });
      setIsAddProductOpen(false);
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      images: product.images || []
    });
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct.product_id || !editingProduct.name || !editingProduct.category || !editingProduct.price || !editingProduct.stock) {
      toast.error('Please fill in all required fields including Product ID');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/products/${editingProduct.product_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: editingProduct.product_id,
          name: editingProduct.name,
          category: editingProduct.category,
          price: parseFloat(editingProduct.price),
          stock: parseInt(editingProduct.stock),
          description: editingProduct.description,
          image: editingProduct.image,
          images: editingProduct.images || []
        })
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to update product');
        } catch (e) {
          throw new Error('Failed to update product');
        }
      }

      const data = await response.json();
      await fetchData();
      setEditingProduct(null);
      setIsEditProductOpen(false);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to delete product');
        } catch (e) {
          throw new Error('Failed to delete product');
        }
      }

      await fetchData();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // If cancelling, show dialog to ask for reason
    if (newStatus === 'Cancelled') {
      setCancellingOrderId(orderId);
      setCancelDialogOpen(true);
      return;
    }

    try {
      const order = orders.find(o => o.id === orderId);
      const response = await fetch(`http://localhost:8000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...order,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchData();
      toast.success('Order status updated');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      const order = orders.find(o => o.id === cancellingOrderId);
      const response = await fetch(`http://localhost:8000/api/orders/${cancellingOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...order,
          status: 'Cancelled',
          cancellation_reason: cancellationReason,
          cancelled_by: 'admin',
          cancelled_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      await fetchData();
      toast.success('Order cancelled successfully');
      setCancelDialogOpen(false);
      setCancellingOrderId(null);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'In Stock': 'default',
      'Low Stock': 'warning',
      'Out of Stock': 'destructive',
      'Delivered': 'default',
      'Shipped': 'secondary',
      'Processing': 'outline',
      'Pending': 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStockStatus = (stock) => {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  };

  const stats = [
    { label: 'Total Revenue', value: `₹${(Array.isArray(orders) ? orders : []).filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}`, icon: DollarSign, change: '+12.5%', trend: 'up' },
    { label: 'Total Orders', value: (Array.isArray(orders) ? orders : []).length, icon: ShoppingCart, change: '+8.2%', trend: 'up' },
    { label: 'Products', value: (Array.isArray(products) ? products : []).length, icon: Package, change: '+3', trend: 'up' },
    { label: 'Customers', value: (Array.isArray(customers) ? customers : []).length, icon: Users, change: '+15.3%', trend: 'up' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-2 -ml-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store
            </Button>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your jewelry store</p>
          </div>
          <Button variant="destructive" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className={`flex items-center text-xs font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="returns" className="relative">
              Returns
              {returnRequests && returnRequests.filter(r => r.return_status === 'Pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {returnRequests.filter(r => r.return_status === 'Pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <CardTitle>Product Management</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10 w-full sm:w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                      <DialogTrigger asChild>
                        <Button className="btn-luxury">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="product_id">Unique Product ID *</Label>
                            <Input 
                              id="product_id" 
                              placeholder="e.g., SKU-001, RING-GOLD-001"
                              value={newProduct.product_id}
                              onChange={(e) => setNewProduct({ ...newProduct, product_id: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Unique identifier for this product (required)</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input 
                              id="name" 
                              placeholder="Enter product name"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Input 
                              id="category" 
                              placeholder="e.g., Rings, Necklaces, Earrings"
                              value={newProduct.category}
                              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="price">Price (₹) *</Label>
                              <Input 
                                id="price" 
                                type="number" 
                                placeholder="0.00"
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="stock">Stock *</Label>
                              <Input 
                                id="stock" 
                                type="number" 
                                placeholder="0"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input 
                              id="description" 
                              placeholder="Enter product description"
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="image">Image URL (Legacy)</Label>
                            <Input 
                              id="image" 
                              placeholder="Enter image URL"
                              value={newProduct.image}
                              onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                            />
                          </div>
                          
                          {/* Image Upload Section */}
                          <div className="space-y-2">
                            <Label>Upload Images (Up to 5)</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, false)}
                                className="hidden"
                                id="image-upload-add"
                              />
                              <label htmlFor="image-upload-add" className="cursor-pointer">
                                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to upload images or drag and drop</p>
                              </label>
                            </div>
                            
                            {/* Display uploaded images */}
                            {newProduct.images && newProduct.images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">{newProduct.images.length}/5 images</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {newProduct.images.map((img, index) => (
                                    <div key={index} className="relative">
                                      <img 
                                        src={img} 
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-20 object-cover rounded"
                                      />
                                      <button
                                        onClick={() => removeImage(index, false)}
                                        className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                                      >
                                        <X className="h-3 w-3 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button onClick={handleAddProduct} className="w-full btn-luxury">
                            Add Product
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unique ID</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(products) && products.length > 0 ? products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.product_id}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>₹{product.price?.toLocaleString() || '0'}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{getStatusBadge(getStockStatus(product.stock))}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteProduct(product.product_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                            No products found. Add one to get started!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(orders) && orders.length > 0 ? orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id?.substring(0, 8)}</TableCell>
                          <TableCell>{order.customer_email || 'N/A'}</TableCell>
                          <TableCell>{order.items?.length || 0}</TableCell>
                          <TableCell className="font-medium">₹{order.total?.toLocaleString() || '0'}</TableCell>
                          <TableCell>{new Date(order.date).toLocaleDateString() || 'N/A'}</TableCell>
                          <TableCell>
                            <Select value={order.status} onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Processing">Processing</SelectItem>
                                <SelectItem value="WhatsApp Sent">WhatsApp Sent</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Shipped">Shipped</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            {order.status === 'Cancelled' && order.cancellation_reason && (
                              <div className="mt-2 text-xs">
                                <p className="text-red-600 font-semibold">
                                  {order.cancelled_by === 'user' ? '👤 User cancelled' : '🛡️ Admin cancelled'}
                                </p>
                                <p className="text-muted-foreground">"{order.cancellation_reason}"</p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                            No orders found yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(customers) && customers.length > 0 ? customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">#{customer.id?.substring(0, 8)}</TableCell>
                          <TableCell>{customer.name || 'N/A'}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.orders || 0}</TableCell>
                          <TableCell className="font-medium">₹{(customer.spent || 0).toLocaleString()}</TableCell>
                          <TableCell>{customer.joined ? new Date(customer.joined).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan="7" className="text-center py-8 text-muted-foreground">
                            No customers found yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Return Requests Tab */}
          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Return Requests Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Return Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(returnRequests) && returnRequests.length > 0 ? returnRequests.map((returnReq) => (
                        <TableRow key={returnReq.id}>
                          <TableCell className="font-medium">#{returnReq.id?.substring(0, 8)}</TableCell>
                          <TableCell>{returnReq.customer_email}</TableCell>
                          <TableCell className="max-w-xs truncate">{returnReq.return_reason || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              returnReq.return_status === 'Pending' ? 'warning' :
                              returnReq.return_status === 'Approved' ? 'default' :
                              returnReq.return_status === 'Rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {returnReq.return_status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{returnReq.return_requested_at ? new Date(returnReq.return_requested_at).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedReturnOrder(returnReq);
                                setReturnStatusValue(returnReq.return_status || 'Pending');
                                setReturnNotes(returnReq.admin_return_notes || '');
                                setReturnStatusDialogOpen(true);
                              }}
                            >
                              Update Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan="6" className="text-center py-8 text-muted-foreground">
                            No return requests yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Return Status Dialog */}
      <Dialog open={returnStatusDialogOpen} onOpenChange={setReturnStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Return Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="return-status" className="text-foreground mb-2 block">Return Status</Label>
              <Select value={returnStatusValue} onValueChange={setReturnStatusValue}>
                <SelectTrigger id="return-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="return-admin-notes" className="text-foreground mb-2 block">Admin Notes (Optional)</Label>
              <Textarea
                id="return-admin-notes"
                placeholder="Add notes about this return..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReturnStatusDialogOpen(false)}>Cancel</Button>
              <Button 
                className="flex-1 btn-luxury"
                onClick={async () => {
                  if (!returnStatusValue) {
                    toast.error('Please select a status');
                    return;
                  }
                  try {
                    const response = await fetch(`http://localhost:8000/api/admin/return-requests/${selectedReturnOrder.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        return_status: returnStatusValue,
                        notes: returnNotes
                      })
                    });

                    if (!response.ok) {
                      throw new Error('Failed to update return status');
                    }

                    await fetchData();
                    toast.success('Return status updated');
                    setReturnStatusDialogOpen(false);
                    setSelectedReturnOrder(null);
                    setReturnStatusValue('');
                    setReturnNotes('');
                  } catch (error) {
                    console.error('Error updating return status:', error);
                    toast.error('Failed to update return status');
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product_id">Unique Product ID *</Label>
                <Input 
                  id="edit-product_id" 
                  placeholder="e.g., SKU-001, RING-GOLD-001"
                  value={editingProduct.product_id}
                  onChange={(e) => setEditingProduct({ ...editingProduct, product_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input 
                  id="edit-name" 
                  placeholder="Enter product name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Input 
                  id="edit-category" 
                  placeholder="e.g., Rings, Necklaces, Earrings"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹) *</Label>
                  <Input 
                    id="edit-price" 
                    type="number" 
                    placeholder="0.00"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock *</Label>
                  <Input 
                    id="edit-stock" 
                    type="number" 
                    placeholder="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description" 
                  placeholder="Enter product description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL (Legacy)</Label>
                <Input 
                  id="edit-image" 
                  placeholder="Enter image URL"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Product Images (Up to 5)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <label htmlFor="image-upload-edit" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload images or drag and drop</p>
                  </label>
                </div>

                {/* Display uploaded images */}
                {editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{editingProduct.images.length}/5 images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editingProduct.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            onClick={() => removeImage(index, true)}
                            className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleUpdateProduct} className="w-full btn-luxury">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
              <textarea
                id="cancellation-reason"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                placeholder="Please provide a reason for cancelling this order..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCancelDialogOpen(false);
                  setCancellingOrderId(null);
                  setCancellationReason('');
                }}
              >
                Back
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
    </div>
  );
};

export default AdminDashboard;