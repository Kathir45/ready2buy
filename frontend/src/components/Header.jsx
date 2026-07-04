import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export const Header = ({ cartCount, user }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  const menuItems = [
    { label: 'Shop', path: '/products' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Track Orders', path: '/track-orders' },
  ];

  // Handle search with debounce
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowResults(value.length > 0);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't search if query is empty
    if (value.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Debounce search - wait 300ms after user stops typing
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const allProducts = await response.json();

        // Filter products based on search query
        const filtered = allProducts.filter(product =>
          product.name.toLowerCase().includes(value.toLowerCase()) ||
          product.category.toLowerCase().includes(value.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
        );

        // Limit results to 6
        setSearchResults(filtered.slice(0, 6));
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle clicking on a product result
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <Crown className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-foreground">Ready</span>
                <span className="text-gradient-gold">2Buy</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jewelry..."
                  className="pl-10 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && setShowResults(true)}
                />

                {/* Search Results Dropdown */}
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.category}
                              </p>
                            </div>
                            <p className="font-semibold text-sm text-primary">
                              ₹{product.price}
                            </p>
                          </div>
                        ))}
                        {searchResults.length > 0 && (
                          <div
                            onClick={() => handleSearchSubmit({ preventDefault: () => {} })}
                            className="p-3 text-center text-sm text-primary hover:bg-muted/50 cursor-pointer font-medium border-t border-border"
                          >
                            View all results for "{searchQuery}"
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">


            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={() => navigate(user ? '/profile' : '/login')}
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-primary"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search jewelry..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => searchQuery.length > 0 && setShowResults(true)}
                      />

                      {/* Mobile Search Results */}
                      {showResults && searchQuery.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <>
                              {searchResults.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    handleProductClick(product.id);
                                    setIsMenuOpen(false);
                                  }}
                                  className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  {product.image && (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {product.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {product.category}
                                    </p>
                                  </div>
                                  <p className="font-semibold text-sm text-primary">
                                    ₹{product.price}
                                  </p>
                                </div>
                              ))}
                              <div
                                onClick={() => {
                                  handleSearchSubmit({ preventDefault: () => {} });
                                  setIsMenuOpen(false);
                                }}
                                className="p-3 text-center text-sm text-primary hover:bg-muted/50 cursor-pointer font-medium border-t border-border"
                              >
                                View all results
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-3">
                    {menuItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2 text-left"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;