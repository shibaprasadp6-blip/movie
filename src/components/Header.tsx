import { Search, Menu, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "TV Series", href: "/series" },
  ];

  return (
    <header className="bg-background border-b border-border/50 shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                MovieHub
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href={item.href}>{item.name}</a>
              </Button>
            ))}
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search movies, series..."
              className="pl-10 w-48 lg:w-64 bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

            <Button variant="ghost" size="sm" className="sm:hidden">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="justify-start"
                  asChild
                >
                  <a href={item.href}>{item.name}</a>
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
