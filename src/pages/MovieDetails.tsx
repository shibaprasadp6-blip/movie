import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Star, Calendar, Clock, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaClips, setMediaClips] = useState<any[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      const { data: movie, error: movieError } = await supabase
        .from("movies")
        .select("*, genre:genres(name)")
        .eq("id", id)
        .single();

      if (movie) {
        setSelectedMedia({ ...movie, poster: movie.poster_url, type: 'movie' });
        return;
      }

      if (movieError && movieError.code !== 'PGRST116') {
        console.error("Error fetching movie:", movieError);
      }

      const { data: series, error: seriesError } = await supabase
        .from("series")
        .select("*, genre:genres(name)")
        .eq("id", id)
        .single();

      if (series) {
        setSelectedMedia({ ...series, poster: series.poster_url, type: 'series' });
        return;
      }

      if (seriesError && seriesError.code !== 'PGRST116') {
        console.error("Error fetching series:", seriesError);
      }
    };

    const fetchMediaClips = async () => {
        const { data, error } = await supabase
            .from("media_clips")
            .select("*")
            .eq("movie_id", id);

        if (error) {
            console.error("Error fetching media clips:", error);
        } else {
            setMediaClips(data);
        }
    };

    if (id) {
      fetchMedia();
      fetchMediaClips();
    }
  }, [id]);

  if (!selectedMedia) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Not Found</h1>
          <p className="text-muted-foreground">The requested movie or web series could not be found.</p>
        </div>
      </div>
    );
  }

  const { title, poster, rating, year, duration, genre, type } = selectedMedia;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src={poster} alt={title} className="w-full h-auto rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>{year}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{duration}</span>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary" className="bg-primary/90 text-white border-0">
                {type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                {genre.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              This is a placeholder description. In a real application, this would be fetched from the database.
            </p>
          </div>
        </div>

        {/* Media Clips Section */}
        <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Screenshots</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaClips.map((clip) => (
                    <div key={clip.id} className="group relative overflow-hidden rounded-lg">
                        <img src={clip.clip_url} alt={`media clip ${clip.id}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
