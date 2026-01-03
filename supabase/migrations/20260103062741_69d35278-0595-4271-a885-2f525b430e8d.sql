-- =============================================
-- TravelBuddy Full Database Schema
-- =============================================

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  travel_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Cities Table
-- =============================================
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  hero_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  best_time_to_visit TEXT,
  safety_notes TEXT,
  family_tips TEXT,
  timezone TEXT,
  currency TEXT,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone" ON public.cities
  FOR SELECT USING (true);

-- =============================================
-- Neighborhoods Table
-- =============================================
CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_family_friendly BOOLEAN DEFAULT true,
  highlight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Neighborhoods are viewable by everyone" ON public.neighborhoods
  FOR SELECT USING (true);

-- =============================================
-- Attractions Table
-- =============================================
CREATE TABLE public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  price_adult DECIMAL(10,2),
  price_child DECIMAL(10,2),
  price_notes TEXT,
  ticket_online_url TEXT,
  ticket_advice TEXT,
  best_time TEXT,
  duration_minutes INTEGER,
  is_family_friendly BOOLEAN DEFAULT true,
  is_indoor BOOLEAN DEFAULT false,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address TEXT,
  rating DECIMAL(2,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attractions are viewable by everyone" ON public.attractions
  FOR SELECT USING (true);

-- =============================================
-- Restaurants Table
-- =============================================
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cuisine TEXT,
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  is_family_friendly BOOLEAN DEFAULT true,
  has_kids_menu BOOLEAN DEFAULT false,
  is_halal BOOLEAN DEFAULT false,
  is_vegetarian_friendly BOOLEAN DEFAULT false,
  is_vegan_friendly BOOLEAN DEFAULT false,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address TEXT,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants
  FOR SELECT USING (true);

-- =============================================
-- Transport Info Table
-- =============================================
CREATE TABLE public.transport_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  public_transport_overview TEXT,
  metro_info TEXT,
  bus_info TEXT,
  ticket_options TEXT,
  family_pass_info TEXT,
  ride_hailing_apps TEXT[],
  car_rental_daily_cost TEXT,
  parking_notes TEXT,
  airport_transfer_options JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transport info is viewable by everyone" ON public.transport_info
  FOR SELECT USING (true);

-- =============================================
-- Favorites Table (User-specific)
-- =============================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorite_type_check CHECK (
    (attraction_id IS NOT NULL AND restaurant_id IS NULL) OR
    (attraction_id IS NULL AND restaurant_id IS NOT NULL)
  ),
  UNIQUE(user_id, attraction_id),
  UNIQUE(user_id, restaurant_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Restaurant Visits Table (User-specific)
-- =============================================
CREATE TABLE public.restaurant_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

ALTER TABLE public.restaurant_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visits" ON public.restaurant_visits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visits" ON public.restaurant_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits" ON public.restaurant_visits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visits" ON public.restaurant_visits
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Itineraries Table (User-specific)
-- =============================================
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  num_days INTEGER NOT NULL,
  travel_style TEXT,
  budget_level TEXT,
  pace TEXT,
  dietary_preferences TEXT[],
  home_base TEXT,
  estimated_daily_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries" ON public.itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own itineraries" ON public.itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries" ON public.itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries" ON public.itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Itinerary Items Table
-- =============================================
CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  time_slot TEXT NOT NULL,
  item_type TEXT NOT NULL,
  attraction_id UUID REFERENCES public.attractions(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  custom_title TEXT,
  custom_description TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Create a function to check itinerary ownership
CREATE OR REPLACE FUNCTION public.owns_itinerary(itinerary_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itineraries
    WHERE id = itinerary_uuid AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view their own itinerary items" ON public.itinerary_items
  FOR SELECT USING (public.owns_itinerary(itinerary_id));

CREATE POLICY "Users can create their own itinerary items" ON public.itinerary_items
  FOR INSERT WITH CHECK (public.owns_itinerary(itinerary_id));

CREATE POLICY "Users can update their own itinerary items" ON public.itinerary_items
  FOR UPDATE USING (public.owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete their own itinerary items" ON public.itinerary_items
  FOR DELETE USING (public.owns_itinerary(itinerary_id));

-- =============================================
-- Update timestamp function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_visits_updated_at
  BEFORE UPDATE ON public.restaurant_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();