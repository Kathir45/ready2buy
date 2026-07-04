import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Gem, Disc, Heart, Sparkles, Watch, Crown } from 'lucide-react';
import { toast } from 'sonner';

export const Categories = () => {
  const [categories, setCategories] = useState([
    { name: 'Rings', icon: Disc, color: 'from-rose-500 to-pink-600' },
    { name: 'Necklaces', icon: Gem, color: 'from-amber-500 to-yellow-600' },
    { name: 'Earrings', icon: Sparkles, color: 'from-blue-500 to-cyan-600' },
    { name: 'Bracelets', icon: Heart, color: 'from-purple-500 to-indigo-600' },
    { name: 'Anklets', icon: Watch, color: 'from-green-500 to-emerald-600' },
    { name: 'Pendants', icon: Crown, color: 'from-amber-600 to-orange-600' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const products = await response.json();

        // Count products by category
        const categoryCounts = {};
        products.forEach(product => {
          const category = product.category || 'Other';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Update categories with real counts
        setCategories(prevCategories => prevCategories.map(cat => ({
          ...cat,
          count: categoryCounts[cat.name] || 0
        })));
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
        // Set default counts if fetch fails
        setCategories(prevCategories => prevCategories.map(cat => ({
          ...cat,
          count: 0
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryCounts();
  }, []);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Shop by Category
          </h2>
          <div className="gold-divider mb-4" />
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Explore our curated collection of fine jewelry
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className="group cursor-pointer overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6 flex flex-col items-center text-center">
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} opacity-10 absolute inset-0 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  {/* Category Name */}
                  <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                    {category.name}
                  </h3>

                  {/* Count */}
                  <p className="text-xs text-muted-foreground">
                    {category.count} items
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
