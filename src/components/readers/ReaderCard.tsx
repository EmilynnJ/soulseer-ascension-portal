import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Sparkles, MessageSquare, Phone, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

type ReaderCardProps = {
  id: string;
  name: string;
  imageUrl?: string;
  rating: number;
  totalReadings: number;
  categories: string[];
  isOnline: boolean;
  isAvailable: boolean;
  rates: {
    chat: number;
    audio: number;
    video: number;
  };
};

export const ReaderCard = ({
  id,
  name,
  imageUrl,
  rating,
  totalReadings,
  categories,
  isOnline,
  isAvailable,
  rates,
}: ReaderCardProps) => {
  const navigate = useNavigate();
  
  const handleStartReading = (type: 'chat' | 'audio' | 'video') => {
    navigate(`/reading/new?readerId=${id}&type=${type}`);
  };

  return (
    <Card className="w-full max-w-md overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 text-white">
      <CardHeader className="p-0 relative">
        <div className="h-40 bg-gradient-to-r from-pink-500 to-purple-600 relative">
          {/* Reader image */}
          <div className="absolute -bottom-12 left-4">
            <Avatar className="h-24 w-24 border-4 border-gray-800">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="bg-pink-600 text-2xl">
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Online status */}
          <div className={`absolute top-3 right-3 flex items-center ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium">
              {isOnline ? (isAvailable ? 'Available' : 'Busy') : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="pt-14 px-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{name}</h3>
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm">
                  {rating.toFixed(1)} • {totalReadings} readings
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {categories.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary" className="bg-pink-900/50 text-pink-300">
                  {category}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge variant="outline" className="bg-gray-800/50 text-gray-400">
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-pink-400 mr-2" />
              <span>Chat</span>
            </div>
            <div className="text-right">
              <p className="font-medium">${(rates.chat / 100).toFixed(2)}/min</p>
              <p className="text-xs text-gray-400">${(rates.chat * 5 / 100).toFixed(2)} for 5 min</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-pink-400 mr-2" />
              <span>Voice Call</span>
            </div>
            <div className="text-right">
              <p className="font-medium">${(rates.audio / 100).toFixed(2)}/min</p>
              <p className="text-xs text-gray-400">${(rates.audio * 5 / 100).toFixed(2)} for 5 min</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <Video className="w-5 h-5 text-pink-400 mr-2" />
              <span>Video Call</span>
            </div>
            <div className="text-right">
              <p className="font-medium">${(rates.video / 100).toFixed(2)}/min</p>
              <p className="text-xs text-gray-400">${(rates.video * 5 / 100).toFixed(2)} for 5 min</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col space-y-2">
        <Button 
          onClick={() => handleStartReading('chat')} 
          className="w-full bg-pink-600 hover:bg-pink-700 text-white"
          disabled={!isOnline || !isAvailable}
        >
          {isOnline && isAvailable ? 'Start Chat' : 'Not Available'}
        </Button>
        
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            onClick={() => handleStartReading('audio')}
            disabled={!isOnline || !isAvailable}
          >
            <Phone className="w-4 h-4 mr-2" />
            Voice
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
            onClick={() => handleStartReading('video')}
            disabled={!isOnline || !isAvailable}
          >
            <Video className="w-4 h-4 mr-2" />
            Video
          </Button>
        </div>
        
        <div className="flex items-center justify-center w-full pt-2">
          <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
          <span className="text-xs text-gray-400">
            {isOnline ? (isAvailable ? 'Available now' : 'Currently in a reading') : 'Offline - Check back later'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};
