import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const collections = [
  {
    id: 1,
    title: 'Bridal Collection',
    description: 'Celebrate your special day with timeless elegance',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    itemCount: 45,
  },
  {
    id: 2,
    title: 'Everyday Luxury',
    description: 'Sophisticated pieces for daily wear',
    image: 'https://images.unsplash.com/photo-1755151606128-7ca2f97e46ae',
    itemCount: 78,
  },
  {
    id: 3,
    title: 'Statement Pieces',
    description: 'Bold designs that make an impact',
    image: 'https://images.unsplash.com/photo-1767391255584-763f98ced9d0',
    itemCount: 32,
  },
];

export const Collections = () => {
  return (
    <section className="py-20 bg-muted/30" id="collections">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Our Collections
          </h2>
          <div className="gold-divider mb-4" />
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Carefully curated collections for every occasion
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {collections.map((collection, index) => (
            <Card
              key={collection.id}
              className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/40 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="text-sm uppercase tracking-wider text-primary mb-2">
                      {collection.itemCount} Items
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {collection.title}
                    </h3>
                    <p className="text-white/90 mb-4 text-sm">
                      {collection.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white hover:text-secondary transition-all"
                    >
                      Explore Collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Collections;