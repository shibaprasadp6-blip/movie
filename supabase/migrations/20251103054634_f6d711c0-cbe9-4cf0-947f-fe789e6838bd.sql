-- Create genres table
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create movies table
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  genre_id UUID REFERENCES public.genres(id),
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft')),
  download_link TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create series table
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  genre_id UUID REFERENCES public.genres(id),
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft')),
  seasons INTEGER NOT NULL DEFAULT 1,
  download_link TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create clips table for additional media
CREATE TABLE public.media_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  clip_url TEXT NOT NULL,
  clip_type TEXT NOT NULL CHECK (clip_type IN ('trailer', 'scene', 'behind_the_scenes', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT media_clips_check CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL) OR
    (movie_id IS NULL AND series_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_clips ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, no auth required for admin operations in this setup)
CREATE POLICY "Anyone can read genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert genres" ON public.genres FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update genres" ON public.genres FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete genres" ON public.genres FOR DELETE USING (true);

CREATE POLICY "Anyone can read movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movies" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update movies" ON public.movies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete movies" ON public.movies FOR DELETE USING (true);

CREATE POLICY "Anyone can read series" ON public.series FOR SELECT USING (true);
CREATE POLICY "Anyone can insert series" ON public.series FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update series" ON public.series FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete series" ON public.series FOR DELETE USING (true);

CREATE POLICY "Anyone can read clips" ON public.media_clips FOR SELECT USING (true);
CREATE POLICY "Anyone can insert clips" ON public.media_clips FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update clips" ON public.media_clips FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete clips" ON public.media_clips FOR DELETE USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posters', 'posters', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('clips', 'clips', true);

-- Storage policies
CREATE POLICY "Anyone can upload posters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posters');
CREATE POLICY "Anyone can view posters" ON storage.objects FOR SELECT USING (bucket_id = 'posters');
CREATE POLICY "Anyone can update posters" ON storage.objects FOR UPDATE USING (bucket_id = 'posters');
CREATE POLICY "Anyone can delete posters" ON storage.objects FOR DELETE USING (bucket_id = 'posters');

CREATE POLICY "Anyone can upload clips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clips');
CREATE POLICY "Anyone can view clips" ON storage.objects FOR SELECT USING (bucket_id = 'clips');
CREATE POLICY "Anyone can update clips" ON storage.objects FOR UPDATE USING (bucket_id = 'clips');
CREATE POLICY "Anyone can delete clips" ON storage.objects FOR DELETE USING (bucket_id = 'clips');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_movies
  BEFORE UPDATE ON public.movies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_series
  BEFORE UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default genres
INSERT INTO public.genres (name) VALUES
  ('Action'),
  ('Drama'),
  ('Comedy'),
  ('Sci-Fi'),
  ('Fantasy'),
  ('Horror'),
  ('Thriller'),
  ('Romance');