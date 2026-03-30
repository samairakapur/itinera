import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAttractionImage } from '@/lib/imageUtils';

/**
 * Resolves the best available image for an attraction or restaurant.
 *
 * Immediately returns a static fallback (curated city photo or category photo)
 * so the UI never flashes empty. Then calls the resolve-image Edge Function,
 * which tries Wikimedia Commons → Foursquare → Unsplash → Pexels → Pixabay
 * in order, and updates the URL when a better match arrives.
 */
export function useResolvedImage(
  name: string,
  cityName?: string,
  category?: string,
): string {
  const [imageUrl, setImageUrl] = useState<string>(() =>
    getAttractionImage(name, cityName, category)
  );

  useEffect(() => {
    if (!name || !cityName) return;

    let cancelled = false;

    supabase.functions
      .invoke('resolve-image', { body: { name, city: cityName, category } })
      .then(({ data }) => {
        if (!cancelled && data?.url) {
          setImageUrl(data.url);
        }
      })
      .catch(() => {
        // silently keep static fallback on error
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, cityName, category]);

  return imageUrl;
}
