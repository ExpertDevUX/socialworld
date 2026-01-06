import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationDropdown from "@/components/NotificationDropdown";

const Header = () => {
  return (
    <header className="fixed top-0 right-0 p-4 flex items-center gap-2 z-50">
      <LanguageSelector />
      <NotificationDropdown />
      <ThemeToggle />
    </header>
  );
};

export default Header;
