import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Users, Sparkles, Heart, ShoppingBag, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export const About = () => {
  const navigate = useNavigate();
  const stats = [
    { label: 'Happy Customers', value: '50K+', icon: Users },
    { label: 'Products Sold', value: '200K+', icon: ShoppingBag },
    { label: 'Years of Excellence', value: '10+', icon: Award },
    { label: 'Customer Satisfaction', value: '98%', icon: Heart }
  ];

  const values = [
    {
      icon: Sparkles,
      title: 'Quality First',
      description: 'We handpick each product to ensure premium quality and durability.'
    },
    {
      icon: Heart,
      title: 'Customer Focused',
      description: 'Your satisfaction is our priority. We go the extra mile to ensure you love what you buy.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Constantly evolving to bring you the latest trends and timeless classics.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Award-winning service and products that exceed expectations.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      bio: '15 years of experience in luxury retail'
    },
    {
      name: 'Michael Chen',
      role: 'Head of Product',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      bio: 'Expert in curating premium collections'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Customer Experience Lead',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      bio: 'Passionate about delivering exceptional service'
    },
    {
      name: 'David Park',
      role: 'Design Director',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      bio: 'Creating beautiful shopping experiences'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-luxury-gold/10 to-luxury-blue/10 py-20">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-luxury-gold text-white">Our Story</Badge>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Elevating Your Shopping Experience
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Since 2014, Ready2Buy has been curating premium products that blend quality, 
              style, and innovation. We believe shopping should be an experience, not just a transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <stat.icon className="h-10 w-10 mx-auto mb-4 text-luxury-gold" />
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Our Journey
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Ready2Buy was born from a simple idea: shopping for premium products 
                  should be easy, enjoyable, and accessible to everyone. What started as 
                  a small boutique has grown into a trusted destination for quality goods.
                </p>
                <p>
                  We've built lasting relationships with manufacturers and artisans worldwide, 
                  ensuring every product meets our rigorous standards. From timeless classics 
                  to cutting-edge innovations, we're committed to bringing you the best.
                </p>
                <p>
                  Today, we serve over 50,000 satisfied customers globally, but our mission 
                  remains unchanged: to deliver exceptional products with exceptional service.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400"
                alt="Store"
                className="rounded-lg shadow-lg h-64 w-full object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400"
                alt="Products"
                className="rounded-lg shadow-lg h-64 w-full object-cover mt-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-luxury-gold text-white">Our Values</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              What Drives Us
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-luxury-gold/10 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-luxury-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-luxury-gold text-white">Our Team</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Meet the People Behind Ready2Buy
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A passionate team dedicated to your satisfaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-luxury-gold font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-luxury-gold/10 to-luxury-blue/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and discover why Ready2Buy is the 
            trusted choice for premium products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-luxury" onClick={() => navigate('/products')}>
              Shop Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
              Get in Touch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
