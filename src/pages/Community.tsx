import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Users, 
  Heart, 
  Star, 
  TrendingUp, 
  Clock, 
  Search,
  Plus,
  Eye,
  ThumbsUp,
  Pin
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  author_avatar: string;
  category: string;
  created_at: string;
  replies: number;
  views: number;
  likes: number;
  is_pinned: boolean;
  is_featured: boolean;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  posts_count: number;
  icon: string;
  color: string;
}

const Community: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      // Sample forum categories
      const sampleCategories: Category[] = [
        {
          id: '1',
          name: 'General Discussion',
          description: 'General spiritual discussions and questions',
          posts_count: 234,
          icon: '💫',
          color: 'purple'
        },
        {
          id: '2',
          name: 'Tarot & Oracle Cards',
          description: 'Discussions about tarot and oracle card readings',
          posts_count: 189,
          icon: '🔮',
          color: 'pink'
        },
        {
          id: '3',
          name: 'Crystal Healing',
          description: 'Share knowledge about crystals and their healing properties',
          posts_count: 156,
          icon: '💎',
          color: 'blue'
        },
        {
          id: '4',
          name: 'Dream Interpretation',
          description: 'Share and interpret dreams with the community',
          posts_count: 123,
          icon: '🌙',
          color: 'indigo'
        },
        {
          id: '5',
          name: 'Astrology',
          description: 'Astrological insights and birth chart discussions',
          posts_count: 167,
          icon: '⭐',
          color: 'yellow'
        },
        {
          id: '6',
          name: 'Meditation & Mindfulness',
          description: 'Meditation techniques and mindfulness practices',
          posts_count: 145,
          icon: '🧘',
          color: 'green'
        }
      ];

      // Sample forum posts
      const samplePosts: ForumPost[] = [
        {
          id: '1',
          title: 'Welcome to the SoulSeer Community! 🌟',
          content: 'Welcome to our sacred space where souls connect and wisdom flows freely. Share your experiences, ask questions, and support each other on this beautiful spiritual journey.',
          author: 'Luna Mystic',
          author_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b618?w=400',
          category: 'General Discussion',
          created_at: '2024-01-15T10:00:00Z',
          replies: 47,
          views: 892,
          likes: 156,
          is_pinned: true,
          is_featured: true,
          tags: ['welcome', 'community', 'introduction']
        },
        {
          id: '2',
          title: 'Full Moon in Capricorn - Energy Insights',
          content: 'The upcoming full moon in Capricorn is bringing powerful manifestation energy. How are you all feeling this lunar influence? Share your experiences and insights!',
          author: 'Aurora Divine',
          author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
          category: 'Astrology',
          created_at: '2024-01-14T15:30:00Z',
          replies: 23,
          views: 456,
          likes: 78,
          is_pinned: false,
          is_featured: true,
          tags: ['full moon', 'capricorn', 'manifestation', 'lunar energy']
        },
        {
          id: '3',
          title: 'My First Spirit Communication Experience',
          content: 'I wanted to share my first successful spirit communication experience during meditation yesterday. The messages I received were so clear and comforting...',
          author: 'Sarah M.',
          author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          category: 'General Discussion',
          created_at: '2024-01-14T09:15:00Z',
          replies: 34,
          views: 234,
          likes: 89,
          is_pinned: false,
          is_featured: false,
          tags: ['spirit communication', 'meditation', 'first experience']
        },
        {
          id: '4',
          title: 'Crystal Grid for Abundance - Share Your Layouts',
          content: 'I\'ve been experimenting with crystal grids for abundance manifestation. Would love to see what crystal combinations and layouts work best for you all!',
          author: 'Crystal Healer',
          author_avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
          category: 'Crystal Healing',
          created_at: '2024-01-13T14:20:00Z',
          replies: 18,
          views: 345,
          likes: 67,
          is_pinned: false,
          is_featured: false,
          tags: ['crystal grid', 'abundance', 'manifestation', 'layout']
        },
        {
          id: '5',
          title: 'Strange Dream About Flying Purple Dragons',
          content: 'Last night I had the most vivid dream about flying purple dragons carrying messages. Has anyone experienced dragon spirit guides in their dreams?',
          author: 'DreamSeeker',
          author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
          category: 'Dream Interpretation',
          created_at: '2024-01-13T08:45:00Z',
          replies: 12,
          views: 189,
          likes: 34,
          is_pinned: false,
          is_featured: false,
          tags: ['dragons', 'spirit guides', 'dream symbols', 'messages']
        }
      ];

      setCategories(sampleCategories);
      setPosts(samplePosts);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Community...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 font-['Alex_Brush'] mb-4">
            Soul Tribe Community
          </h1>
          <p className="text-xl text-white/90 font-['Playfair_Display'] max-w-2xl mx-auto">
            Connect with fellow spiritual seekers, share experiences, and grow together on your journey
          </p>
        </div>

        <Tabs defaultValue="discussions" className="space-y-8">
          <TabsList className="bg-black/40 border-pink-500/30 grid w-full grid-cols-2 lg:w-96 mx-auto">
            <TabsTrigger 
              value="discussions" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <Users className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-6">
            {/* Search and New Post */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-pink-500/30 text-white placeholder:text-white/60"
                />
              </div>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => setShowNewPostForm(!showNewPostForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Discussion
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' 
                  ? "bg-pink-500 hover:bg-pink-600" 
                  : "border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                }
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className={selectedCategory === category.name 
                    ? "bg-pink-500 hover:bg-pink-600" 
                    : "border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                  }
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </div>

            {/* New Post Form */}
            {showNewPostForm && (
              <Card className="bg-black/40 border-pink-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">
                    Start a New Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Discussion title..."
                    className="bg-black/20 border-pink-500/30 text-white placeholder:text-white/60"
                  />
                  <Textarea
                    placeholder="Share your thoughts, questions, or experiences..."
                    rows={4}
                    className="bg-black/20 border-pink-500/30 text-white placeholder:text-white/60"
                  />
                  <div className="flex gap-2">
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      Post Discussion
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-pink-500/30 text-pink-400"
                      onClick={() => setShowNewPostForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discussions List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-black/40 border-pink-500/30 hover:border-pink-400/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={post.author_avatar}
                        alt={post.author}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              {post.is_pinned && <Pin className="w-4 h-4 text-yellow-400" />}
                              {post.is_featured && <Star className="w-4 h-4 text-pink-400 fill-current" />}
                              <h3 className="text-lg font-semibold text-white font-['Playfair_Display']">
                                {post.title}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-white/60">
                              <span>by {post.author}</span>
                              <span>•</span>
                              <span>{formatDate(post.created_at)}</span>
                              <span>•</span>
                              <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                                {post.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-white/80 font-['Playfair_Display'] mb-3 line-clamp-2">
                          {post.content}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-white/60">
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.replies} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                            Join Discussion
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
                  No discussions found
                </h3>
                <p className="text-white/60 font-['Playfair_Display']">
                  Be the first to start a conversation in this category!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-black/40 border-pink-500/30 hover:border-pink-400/50 transition-all cursor-pointer"
                  onClick={() => setSelectedCategory(category.name)}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{category.icon}</div>
                      <div>
                        <CardTitle className="text-white font-['Playfair_Display']">
                          {category.name}
                        </CardTitle>
                        <CardDescription className="text-white/60">
                          {category.posts_count} discussions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 font-['Playfair_Display'] text-sm">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;