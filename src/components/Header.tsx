import { Languages, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 right-0 p-4 flex items-center gap-2">
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Languages className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Sun className="w-5 h-5" />
      </Button>
    </header>
  );
};

export default Header;
