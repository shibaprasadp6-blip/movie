import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Filter, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Textarea } from "@/components/ui/textarea";

type Genre = {
  id: string;
  name: string;
};

type Movie = {
  id: string;
  title: string;
  year: number;
  genre_id: string | null;
  rating: number;
  status: string;
  download_link: string | null;
  poster_url: string | null;
  genre?: Genre;
};

type Series = Movie & { seasons: number };

type MediaClip = {
  id: string;
  clip_url: string;
  clip_type: string;
};

const Admin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Movie | Series | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  
  // Form states
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [clipFiles, setClipFiles] = useState<File[]>([]);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  // Fetch genres
  const fetchGenres = async () => {
    const { data, error } = await supabase.from("genres").select("*").order("name");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setGenres(data || []);
  };

  // Fetch movies
  const fetchMovies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("movies")
      .select(`
        *,
        genre:genres(id, name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMovies(data || []);
    }
    setLoading(false);
  };

  // Fetch series
  const fetchSeries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("series")
      .select(`
        *,
        genre:genres(id, name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSeries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGenres();
    fetchMovies();
    fetchSeries();
  }, []);

  const stats = useMemo(() => [
    { title: "Total Movies", value: movies.length.toString(), icon: "🎬" },
    { title: "Total Series", value: series.length.toString(), icon: "📺" },
    { title: "Total Genres", value: genres.length.toString(), icon: "🎭" },
    { title: "Published", value: [...movies, ...series].filter(i => i.status === 'Published').length.toString(), icon: "✅" },
  ], [movies.length, series.length, genres.length]);

  // Filtered data based on search and genre
  const filteredData = useMemo(() => {
    const data = activeTab === "movies" ? movies : activeTab === "series" ? series : [];
    return data.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === "all" || item.genre_id === genreFilter;
      return matchesSearch && matchesGenre;
    });
  }, [activeTab, movies, series, searchQuery, genreFilter]);

  // Upload file to storage
  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  };

  // CRUD handlers
  const handleAdd = () => {
    setEditingItem(null);
    setPosterFile(null);
    setPosterPreview(null);
    setClipFiles([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Movie | Series) => {
    setEditingItem(item);
    setPosterFile(null);
    setPosterPreview(item.poster_url);
    setClipFiles([]);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const table = activeTab === "movies" ? "movies" : "series";
    const { error } = await supabase.from(table).delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: `${activeTab.slice(0, -1)} deleted successfully.` });
    
    if (activeTab === "movies") {
      fetchMovies();
    } else {
      fetchSeries();
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get("title") as string;
      const year = parseInt(formData.get("year") as string);
      const genre_id = formData.get("genre_id") as string;
      const rating = parseFloat(formData.get("rating") as string);
      const status = formData.get("status") as string;
      const download_link = formData.get("download_link") as string;

      let poster_url = editingItem?.poster_url || null;

      // Upload poster if new file
      if (posterFile) {
        const fileExt = posterFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        poster_url = await uploadFile(posterFile, 'posters', fileName);
      }

      const baseData = {
        title,
        year,
        genre_id: genre_id || null,
        rating,
        status,
        download_link: download_link || null,
        poster_url,
      };

      if (editingItem) {
        // Update existing item
        const table = activeTab === "movies" ? "movies" : "series";
        const updateData = activeTab === "series" 
          ? { ...baseData, seasons: parseInt(formData.get("seasons") as string) }
          : baseData;

        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq("id", editingItem.id);

        if (error) throw error;

        // Upload clips if any
        if (clipFiles.length > 0) {
          for (const file of clipFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
            const clipUrl = await uploadFile(file, 'clips', fileName);
            
            await supabase.from("media_clips").insert({
              [activeTab === "movies" ? "movie_id" : "series_id"]: editingItem.id,
              clip_url: clipUrl,
              clip_type: "other"
            });
          }
        }

        toast({ title: "Updated", description: `${title} updated successfully.` });
      } else {
        // Add new item
        const table = activeTab === "movies" ? "movies" : "series";
        const insertData = activeTab === "series" 
          ? { ...baseData, seasons: parseInt(formData.get("seasons") as string) }
          : baseData;

        const { data: newItem, error } = await supabase
          .from(table)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        // Upload clips if any
        if (clipFiles.length > 0 && newItem) {
          for (const file of clipFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
            const clipUrl = await uploadFile(file, 'clips', fileName);
            
            await supabase.from("media_clips").insert({
              [activeTab === "movies" ? "movie_id" : "series_id"]: newItem.id,
              clip_url: clipUrl,
              clip_type: "other"
            });
          }
        }

        toast({ title: "Added", description: `${title} added successfully.` });
      }

      setIsDialogOpen(false);
      if (activeTab === "movies") {
        fetchMovies();
      } else {
        fetchSeries();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("genre_name") as string;

    const { error } = await supabase.from("genres").insert({ name });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Genre added successfully." });
    setIsGenreDialogOpen(false);
    fetchGenres();
  };

  const handleDeleteGenre = async (id: string) => {
    const { error } = await supabase.from("genres").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Genre deleted successfully." });
    fetchGenres();
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setClipFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your movie and series content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === "movies" ? "hero" : "ghost"}
            onClick={() => setActiveTab("movies")}
            size="sm"
          >
            Movies
          </Button>
          <Button
            variant={activeTab === "series" ? "hero" : "ghost"}
            onClick={() => setActiveTab("series")}
            size="sm"
          >
            TV Series
          </Button>
          <Button
            variant={activeTab === "genres" ? "hero" : "ghost"}
            onClick={() => setActiveTab("genres")}
            size="sm"
          >
            Genres
          </Button>
        </div>

        {/* Content Management */}
        {activeTab !== "genres" ? (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {activeTab === "movies" ? "Movies" : "TV Series"} Management
                  </CardTitle>
                  <CardDescription>
                    Manage your {activeTab} content and settings
                  </CardDescription>
                </div>
                <Button variant="hero" onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add {activeTab.slice(0, -1)}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    className="pl-10 bg-muted/50 border-border/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50">
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre.id} value={genre.id}>{genre.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="cinema" onClick={() => { setSearchQuery(""); setGenreFilter("all"); }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Data Table */}
              <div className="rounded-md border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Poster</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Rating</TableHead>
                      {activeTab === "series" && <TableHead>Seasons</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={activeTab === "series" ? 8 : 7} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={activeTab === "series" ? 8 : 7} className="text-center">
                          No data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell>
                            {item.poster_url ? (
                              <img src={item.poster_url} alt={item.title} className="w-12 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs">No Image</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.year}</TableCell>
                          <TableCell>{item.genre?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              ⭐ {item.rating}
                            </Badge>
                          </TableCell>
                          {activeTab === "series" && (
                            <TableCell>{(item as Series).seasons}</TableCell>
                          )}
                          <TableCell>
                            <Badge
                              variant={item.status === "Published" ? "default" : "secondary"}
                              className={item.status === "Published" ? "bg-green-600" : ""}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Genres Management */
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Genres Management</CardTitle>
                  <CardDescription>Manage movie and series genres</CardDescription>
                </div>
                <Button variant="hero" onClick={() => setIsGenreDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Genre
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {genres.map(genre => (
                  <Card key={genre.id} className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="font-medium">{genre.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGenre(genre.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gradient-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} {activeTab.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update" : "Create a new"} {activeTab.slice(0, -1)} entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingItem?.title || ""}
                    required
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      defaultValue={editingItem?.year || new Date().getFullYear()}
                      required
                      className="bg-muted/50 border-border/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rating">Rating *</Label>
                    <Input
                      id="rating"
                      name="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      defaultValue={editingItem?.rating || 5.0}
                      required
                      className="bg-muted/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="genre_id">Genre</Label>
                  <Select name="genre_id" defaultValue={editingItem?.genre_id || ""}>
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre.id} value={genre.id}>{genre.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === "series" && (
                  <div className="grid gap-2">
                    <Label htmlFor="seasons">Seasons *</Label>
                    <Input
                      id="seasons"
                      name="seasons"
                      type="number"
                      min="1"
                      defaultValue={"seasons" in (editingItem || {}) ? (editingItem as Series).seasons : 1}
                      required
                      className="bg-muted/50 border-border/50"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="download_link">Download Link</Label>
                  <Textarea
                    id="download_link"
                    name="download_link"
                    defaultValue={editingItem?.download_link || ""}
                    placeholder="Enter download URL"
                    className="bg-muted/50 border-border/50"
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingItem?.status || "Draft"}>
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="poster">Poster Image</Label>
                  <Input
                    id="poster"
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="bg-muted/50 border-border/50"
                  />
                  {posterPreview && (
                    <img src={posterPreview} alt="Preview" className="w-32 h-48 object-cover rounded mt-2" />
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="clips">Additional Clips/Screenshots</Label>
                  <Input
                    id="clips"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleClipChange}
                    className="bg-muted/50 border-border/50"
                  />
                  {clipFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {clipFiles.map((file, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {file.name}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => setClipFiles(clipFiles.filter((_, i) => i !== idx))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "Saving..." : editingItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Genre Dialog */}
        <Dialog open={isGenreDialogOpen} onOpenChange={setIsGenreDialogOpen}>
          <DialogContent className="bg-gradient-card border-border/50">
            <DialogHeader>
              <DialogTitle>Add Genre</DialogTitle>
              <DialogDescription>Create a new genre</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGenre}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="genre_name">Genre Name *</Label>
                  <Input
                    id="genre_name"
                    name="genre_name"
                    required
                    placeholder="Enter genre name"
                    className="bg-muted/50 border-border/50"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGenreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero">
                  Add Genre
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;