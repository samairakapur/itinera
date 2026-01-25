-- Create community_tips table for user-submitted tips/feedback on attractions and restaurants
CREATE TABLE public.community_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('attraction', 'restaurant', 'city')),
  tip_type TEXT NOT NULL CHECK (tip_type IN ('experience', 'timing', 'accuracy', 'recommendation', 'general')),
  content TEXT NOT NULL,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_category_reference CHECK (
    (category = 'attraction' AND attraction_id IS NOT NULL AND restaurant_id IS NULL) OR
    (category = 'restaurant' AND restaurant_id IS NOT NULL AND attraction_id IS NULL) OR
    (category = 'city' AND attraction_id IS NULL AND restaurant_id IS NULL)
  )
);

-- Enable RLS on community_tips
ALTER TABLE public.community_tips ENABLE ROW LEVEL SECURITY;

-- Anyone can view tips
CREATE POLICY "Community tips are viewable by everyone"
  ON public.community_tips
  FOR SELECT
  USING (true);

-- Users can create their own tips
CREATE POLICY "Users can create their own tips"
  ON public.community_tips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tips
CREATE POLICY "Users can update their own tips"
  ON public.community_tips
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tips
CREATE POLICY "Users can delete their own tips"
  ON public.community_tips
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX idx_community_tips_city_id ON public.community_tips(city_id);
CREATE INDEX idx_community_tips_attraction_id ON public.community_tips(attraction_id);
CREATE INDEX idx_community_tips_restaurant_id ON public.community_tips(restaurant_id);
CREATE INDEX idx_community_tips_category ON public.community_tips(category);

-- Create trigger for updated_at
CREATE TRIGGER update_community_tips_updated_at
  BEFORE UPDATE ON public.community_tips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- RLS policies for avatar storage
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);