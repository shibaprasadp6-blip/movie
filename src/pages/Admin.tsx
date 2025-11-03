import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

type Movie = {
  id: number;
  title: string;
  year: number;
  genre: string;
  rating: number;
  status: string;
};

type Series = Movie & { seasons: number };

const Admin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Movie | Series | null>(null);

  // State for mock data
  const [movies, setMovies] = useState<Movie[]>([
    { id: 1, title: "The Dark Knight", year: 2008, genre: "Action", rating: 9.0, status: "Published" },
    { id: 2, title: "Inception", year: 2010, genre: "Sci-Fi", rating: 8.8, status: "Published" },
    { id: 3, title: "Interstellar", year: 2014, genre: "Sci-Fi", rating: 8.6, status: "Draft" },
  ]);

  const [series, setSeries] = useState<Series[]>([
    { id: 1, title: "Breaking Bad", year: 2008, genre: "Drama", rating: 9.5, status: "Published", seasons: 5 },
    { id: 2, title: "Game of Thrones", year: 2011, genre: "Fantasy", rating: 9.3, status: "Published", seasons: 8 },
    { id: 3, title: "Stranger Things", year: 2016, genre: "Sci-Fi", rating: 8.7, status: "Published", seasons: 4 },
  ]);

  const stats = useMemo(() => [
    { title: "Total Movies", value: movies.length.toString(), icon: "🎬" },
    { title: "Total Series", value: series.length.toString(), icon: "📺" },
    { title: "Total Users", value: "0", icon: "👥" },
    { title: "Monthly Views", value: "0", icon: "👁️" },
  ], [movies.length, series.length]);

  // Filtered data based on search and genre
  const filteredData = useMemo(() => {
    const data = activeTab === "movies" ? movies : series;
    return data.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = genreFilter === "all" || item.genre.toLowerCase() === genreFilter.toLowerCase();
      return matchesSearch && matchesGenre;
    });
  }, [activeTab, movies, series, searchQuery, genreFilter]);

  // CRUD handlers
  const handleAdd = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Movie | Series) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (activeTab === "movies") {
      setMovies(movies.filter(m => m.id !== id));
    } else {
      setSeries(series.filter(s => s.id !== id));
    }
    toast({
      title: "Deleted",
      description: `${activeTab.slice(0, -1)} has been deleted successfully.`,
    });
  };

  const handleSave = (formData: FormData) => {
    const title = formData.get("title") as string;
    const year = parseInt(formData.get("year") as string);
    const genre = formData.get("genre") as string;
    const rating = parseFloat(formData.get("rating") as string);
    const status = formData.get("status") as string;

    if (editingItem) {
      // Update existing item
      if (activeTab === "movies") {
        setMovies(movies.map(m => m.id === editingItem.id ? { ...m, title, year, genre, rating, status } : m));
      } else {
        const seasons = parseInt(formData.get("seasons") as string);
        setSeries(series.map(s => s.id === editingItem.id ? { ...s, title, year, genre, rating, status, seasons } : s));
      }
      toast({
        title: "Updated",
        description: `${title} has been updated successfully.`,
      });
    } else {
      // Add new item
      if (activeTab === "movies") {
        const newId = Math.max(...movies.map(m => m.id), 0) + 1;
        setMovies([...movies, { id: newId, title, year, genre, rating, status }]);
      } else {
        const seasons = parseInt(formData.get("seasons") as string);
        const newId = Math.max(...series.map(s => s.id), 0) + 1;
        setSeries([...series, { id: newId, title, year, genre, rating, status, seasons }]);
      }
      toast({
        title: "Added",
        description: `${title} has been added successfully.`,
      });
    }
    setIsDialogOpen(false);
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
        <div className="flex space-x-1 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
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
            variant={activeTab === "users" ? "hero" : "ghost"}
            onClick={() => setActiveTab("users")}
            size="sm"
          >
            Users
          </Button>
        </div>

        {/* Content Management */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {activeTab === "movies" ? "Movies" : activeTab === "series" ? "TV Series" : "Users"} Management
                </CardTitle>
                <CardDescription>
                  Manage your {activeTab} content and settings
                </CardDescription>
              </div>
              <Button variant="hero" onClick={handleAdd}>
                <Plus className="w-4 h-4" />
                Add {activeTab.slice(0, -1)}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
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
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="drama">Drama</SelectItem>
                  <SelectItem value="comedy">Comedy</SelectItem>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="cinema" onClick={() => { setSearchQuery(""); setGenreFilter("all"); }}>
                <Filter className="w-4 h-4" />
                Clear
              </Button>
            </div>

            {/* Data Table */}
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell>{item.genre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          ⭐ {item.rating}
                        </Badge>
                      </TableCell>
                      {activeTab === "series" && (
                        <TableCell>{("seasons" in item ? (item as any).seasons : "-") as React.ReactNode}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gradient-card border-border/50">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} {activeTab.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update" : "Create a new"} {activeTab.slice(0, -1)} entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.currentTarget));
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingItem?.title || ""}
                    required
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
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
                  <Label htmlFor="genre">Genre</Label>
                  <Select name="genre" defaultValue={editingItem?.genre || "Action"}>
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Action">Action</SelectItem>
                      <SelectItem value="Drama">Drama</SelectItem>
                      <SelectItem value="Comedy">Comedy</SelectItem>
                      <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                      <SelectItem value="Fantasy">Fantasy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rating">Rating</Label>
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
                {activeTab === "series" && (
                  <div className="grid gap-2">
                    <Label htmlFor="seasons">Seasons</Label>
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
                  <Label htmlFor="status">Status</Label>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero">
                  {editingItem ? "Update" : "Create"}
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