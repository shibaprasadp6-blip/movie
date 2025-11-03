import { Play, Star, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: number;
  duration: string;
  genre: string;
  type: "movie" | "series";
}

const MovieCard = ({ id, title, poster, rating, year, duration, genre, type }: MovieCardProps) => {
  return (
    <Link to={`/movie/${id}`}>
      <Card className="group relative overflow-hidden bg-gradient-card border-border/50 hover:shadow-elevated transition-all duration-500 hover:-translate-y-2">
        <div className="aspect-[2/3] relative overflow-hidden">
          <img 
            src={poster} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button variant="glassmorphic" size="lg" className="rounded-full">
              <Play className="w-6 h-6 fill-current" />
            </Button>
          </div>

          {/* Type badge */}
          <Badge variant="secondary" className="absolute top-3 left-3 bg-primary/90 text-white border-0">
            {type.toUpperCase()}
          </Badge>

          {/* Rating */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-xs font-medium">{rating}</span>
          </div>
        </div>

        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>{year}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>
          </div>
          
          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
            {genre}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MovieCard;