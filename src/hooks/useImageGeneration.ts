import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useImageGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (prompt: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.image) {
        return data.image;
      }

      throw new Error('No image data received');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generateImage, loading, error };
};