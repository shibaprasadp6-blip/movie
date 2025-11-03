import { useState, useEffect } from "react";
import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Header from "@/components/Header";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [media, setMedia] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchMedia = async () => {
      const { data: movies, error: moviesError } = await supabase.from("movies").select("*, genre:genres(name)");
      if (moviesError) console.error("Error fetching movies:", moviesError);

      const { data: series, error: seriesError } = await supabase.from("series").select("*, genre:genres(name)");
      if (seriesError) console.error("Error fetching series:", seriesError);

      const formattedMovies = movies?.map(movie => ({ ...movie, poster: movie.poster_url, type: 'movie' })) || [];
      const formattedSeries = series?.map(s => ({ ...s, poster: s.poster_url, type: 'series' })) || [];

      setMedia([...formattedMovies, ...formattedSeries]);
    };

    fetchMedia();
  }, []);

  const totalPages = Math.ceil(media.length / itemsPerPage);
  const paginatedMedia = media.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      {/* Movies & Web Series Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Latest Movies & Web Series</h2>
              <p className="text-muted-foreground">Discover the newest releases and trending content</p>
            </div>

            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "hero" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "hero" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Media Grid */}
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              : "space-y-4"
          }>
            {paginatedMedia.map((item) => (
              <MovieCard key={item.id} {...item} genre={item.genre.name} />
            ))}
          </div>

          {media.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No movies or web series found
              </p>
            </div>
          )}

          {/* Pagination */}
            <div className="mt-8">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                        </PaginationItem>
                        {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink href="#" isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext href="#" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
