import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Heart, MapPin, Edit, LogOut, Package, Trash2, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';

export const UserProfile = ({ user, onBack, onLogout }) => {
  const navigate = useNavigate();
  const [editProfile, setEditProfile] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@ready2buy.com',
    phone: '+1 (555) 123-4567',
    address: '123 Luxury Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'India',
  });

  // Fetch wishlist from backend
  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem('ready2buy_token');
      if (!token) {
        setWishlistLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setWishlistItems(data);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setWishlistLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const handleRemoveFromWishlist = async (itemId) => {
    const token = localStorage.getItem('ready2buy_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = (item) => {
    toast.success(`${item.product_name} added to cart!`);
  };

  const handleUpdateProfile = () => {
    localStorage.setItem('ready2buy_user', JSON.stringify(profileData));
    toast.success('Profile updated successfully');
    setEditProfile(false);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" />
                    <AvatarFallback className="text-2xl">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {profileData.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {profileData.email}
                  </p>
                  <Badge variant="secondary" className="mb-4">
                    <User className="h-3 w-3 mr-1" />
                    Premium Member
                  </Badge>
                </div>

                <Separator className="mb-4" />

                {/* Quick Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wishlist Items</span>
                    <span className="font-medium">{wishlistLoading ? '-' : wishlistItems.length}</span>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Actions */}
                <div className="space-y-2">
                  <Dialog open={editProfile} onOpenChange={setEditProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          />
                        </div>
                        <Button onClick={handleUpdateProfile} className="w-full btn-luxury">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <Button 
                onClick={() => navigate('/track-orders')}
                className="btn-luxury"
              >
                <Package className="h-4 w-4 mr-2" />
                View & Track Orders
              </Button>
            </div>
            
            <Tabs defaultValue="wishlist" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>

              {/* Wishlist Tab */}
              <TabsContent value="wishlist">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      My Wishlist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {wishlistLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading wishlist...</p>
                      </div>
                    ) : wishlistItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No items in your wishlist yet</p>
                        <Button onClick={() => navigate('/products')} className="btn-luxury">
                          Explore Products
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {wishlistItems.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="aspect-square bg-muted">
                                <img
                                  src={item.image}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold mb-2 line-clamp-2">{item.product_name}</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {item.category}
                                </p>
                                <p className="text-xl font-bold text-primary mb-3">
                                  ₹{item.price.toLocaleString()}
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="flex-1 btn-luxury"
                                    onClick={() => handleAddToCart(item)}
                                  >
                                    Add to Cart
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveFromWishlist(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Saved Addresses
                      </CardTitle>
                      <Dialog open={editProfile} onOpenChange={setEditProfile}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Address
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Address</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone</Label>
                              <Input
                                id="phone"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Address</Label>
                              <Input
                                id="address"
                                value={profileData.address}
                                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  value={profileData.city}
                                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  value={profileData.state}
                                  onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="zipCode">Zip Code</Label>
                                <Input
                                  id="zipCode"
                                  value={profileData.zipCode}
                                  onChange={(e) => setProfileData({...profileData, zipCode: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                  id="country"
                                  value={profileData.country}
                                  onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                                />
                              </div>
                            </div>
                            <Button onClick={handleUpdateProfile} className="w-full btn-luxury">
                              Save Address
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Card className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <Badge variant="default" className="mb-2">Default</Badge>
                              <h3 className="font-semibold">Home Address</h3>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong className="text-foreground">{profileData.name}</strong></p>
                            <p>{profileData.phone}</p>
                            <p>{profileData.address}</p>
                            <p>{profileData.city}, {profileData.state} {profileData.zipCode}</p>
                            <p>{profileData.country}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;