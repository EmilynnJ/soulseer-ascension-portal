import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { Sparkles, Download } from 'lucide-react';

const BackgroundGenerator = () => {
  const { generateImage, loading, error } = useImageGeneration();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const etherealPrompt = "Ethereal mystical celestial background, vibrant pink and magenta nebula clouds, golden starlight, white cosmic dust, deep black space, spiritual cosmic energy, welcoming divine atmosphere, soft glowing celestial bodies, pink aurora, golden light rays, magical ethereal mist, dreamy cosmic landscape, mystical space background, 8k resolution, ultra detailed, cinematic lighting";

  const handleGenerateBackground = async () => {
    const image = await generateImage(etherealPrompt);
    if (image) {
      setGeneratedImage(image);
      // Apply as background
      document.body.style.backgroundImage = `url(${image})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'soulseer-ethereal-background.png';
      link.click();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="mystical-card p-4 space-y-3">
        <Button
          onClick={handleGenerateBackground}
          disabled={loading}
          className="mystical-card bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-ethereal font-body transition-all duration-500 hover:scale-105"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Ethereal Background'}
        </Button>
        
        {generatedImage && (
          <Button
            onClick={downloadImage}
            variant="outline"
            className="ethereal-border text-mystic-400 hover:bg-mystic-400 hover:text-black font-body w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Background
          </Button>
        )}
        
        {error && (
          <p className="text-red-400 text-sm font-body">{error}</p>
        )}
      </div>
    </div>
  );
};

export default BackgroundGenerator;