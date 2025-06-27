import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Star, Heart, Search, Filter, Gem, Book, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  isDigital: boolean;
}

const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, sortBy]);

  const loadProducts = async () => {
    try {
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Crystal Healing Energy Kit',
          description: 'Complete set of 7 chakra crystals with healing guide and meditation instructions.',
          price: 89.99,
          category: 'Crystals',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
          rating: 4.8,
          reviews: 234,
          seller: 'Luna Mystic',
          isDigital: false
        },
        {
          id: '2',
          name: 'Tarot Deck - Moonlight Dreams',
          description: 'Beautiful 78-card tarot deck with ethereal artwork and comprehensive guidebook.',
          price: 45.99,
          category: 'Tarot',
          image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400',
          rating: 4.9,
          reviews: 187,
          seller: 'Aurora Divine',
          isDigital: false
        },
        {
          id: '3',
          name: 'Digital Oracle Reading Course',
          description: 'Complete online course teaching oracle card reading with video lessons and practice sessions.',
          price: 199.99,
          category: 'Courses',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          rating: 4.7,
          reviews: 92,
          seller: 'Sage Moonwhisper',
          isDigital: true
        }
      ];

      setProducts(sampleProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const addToCart = (productId: string) => {
    console.log('Adding to cart:', productId);
  };

  const categories = ['all', 'Crystals', 'Tarot', 'Courses'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Shop...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 font-['Alex_Brush'] mb-4">
            Spiritual Marketplace
          </h1>
          <p className="text-xl text-white/90 font-['Playfair_Display'] max-w-2xl mx-auto">
            Discover sacred tools, courses, and spiritual items to enhance your journey
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 border-pink-500/30 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-pink-500/30 text-white placeholder:text-white/60"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-black/20 border-pink-500/30 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500/30">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-black/20 border-pink-500/30 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500/30">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-pink-500 hover:bg-pink-600">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="bg-black/40 border-pink-500/30 hover:border-pink-400/50 transition-all">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                {product.isDigital && (
                  <Badge className="absolute top-2 left-2 bg-blue-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Digital
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 border-white/30 text-white hover:bg-white/20"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-white font-['Playfair_Display'] text-lg line-clamp-2">
                  {product.name}
                </CardTitle>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-pink-400">{product.seller}</span>
                  <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                    {product.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-white/80 font-['Playfair_Display'] text-sm line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/80 text-sm">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-400">
                    ${product.price}
                  </span>
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Gem className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
              No products found
            </h3>
            <p className="text-white/60 font-['Playfair_Display']">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;