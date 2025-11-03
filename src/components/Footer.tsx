import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-8 flex justify-between items-center">
        <p className="text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MovieHub. All Rights Reserved.
        </p>
        <Link to="/admin">
          <Button variant="ghost">Admin</Button>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
