import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';

const categories = ["All", "Accessories", "Electronics", "Watches", "Bags", "Footwear", "Rings", "Necklaces", "Earrings"];

export const Products = ({ onProductClick, onAddToCart }) => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.includes('All') || selectedCategories.includes(product.category);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStock = !showInStockOnly || product.stock > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default: // featured
          return b.stock - a.stock;
      }
    });

  const handleCategoryToggle = (category) => {
    if (category === 'All') {
      setSelectedCategories(['All']);
    } else {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories.filter(c => c !== 'All'), category];
      
      setSelectedCategories(newCategories.length === 0 ? ['All'] : newCategories);
    }
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={category} className="text-sm cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Price Range
        </h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={5000}
          step={50}
          minStepsBetweenThumbs={0}
          className="mb-4"
        />
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Min</label>
            <div className="border rounded px-2 py-1">
              <span className="text-sm font-medium">₹{priceRange[0]}</span>
            </div>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">-</div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Max</label>
            <div className="border rounded px-2 py-1">
              <span className="text-sm font-medium">₹{priceRange[1]}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-3">
          <span>₹0</span>
          <span>₹5000</span>
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={showInStockOnly}
            onCheckedChange={setShowInStockOnly}
          />
          <Label htmlFor="inStock" className="text-sm cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={(product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name))}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
          onClick={() => onProductClick(product)}
        />
        {product.stock > 0 && (
          <Badge className="absolute top-2 left-2 bg-green-500 text-white">
            In Stock
          </Badge>
        )}
        {product.stock <= 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            Out of Stock
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>
        <h3 
          className="font-semibold text-lg text-foreground mb-2 hover:text-luxury-gold cursor-pointer transition-colors"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {product.description || 'Premium jewelry item'}
        </p>
        
        {/* Low Stock Warning */}
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-amber-600 font-semibold mb-2">
            ⚠️ Only {product.stock} left!
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-luxury-gold">
            ₹{product.price?.toFixed(2)}
          </span>
          <Button
            className="btn-luxury"
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            size="sm"
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex gap-4">
          <div className="relative w-48 h-48 flex-shrink-0">
            <img
              src={(product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name))}
              alt={product.name}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onProductClick(product)}
            />
            {product.stock > 0 && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                In Stock
              </Badge>
            )}
            {product.stock <= 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                Out of Stock
              </Badge>
            )}
          </div>
          <div className="flex-1 py-4 pr-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Badge variant="outline" className="text-xs mb-2">
                  {product.category}
                </Badge>
                <h3 
                  className="font-semibold text-xl text-foreground hover:text-luxury-gold cursor-pointer transition-colors"
                  onClick={() => onProductClick(product)}
                >
                  {product.name}
                </h3>
              </div>
              <span className="text-2xl font-bold text-luxury-gold">
                ₹{product.price?.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {product.description || 'Premium jewelry item'}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Badge>
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-xs text-amber-600 font-semibold">⚠️ Low Stock</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                className="btn-luxury"
                onClick={() => onAddToCart(product)}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onProductClick(product)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Shop All Products</h1>
          <p className="text-muted-foreground">
            Discover our curated collection of premium products
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Mobile Filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start mb-4"
                    onClick={() => {
                      setSelectedCategories(['All']);
                      setPriceRange([0, 5000]);
                      setShowInStockOnly(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="hidden md:flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories(['All']);
                      setPriceRange([0, 5000]);
                      setShowInStockOnly(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <FilterPanel />
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid/List */}
          <div className="flex-1">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading products...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
                
                {filteredProducts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No products found matching your criteria.
                      </p>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
