import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, MessageSquare, MessageCircle, User, LogOut, Menu, X, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { isAuthenticated, removeToken } from "@/lib/auth";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    removeToken();
    setLocation("/signin");
    setMobileMenuOpen(false);
  };

  const navItems = authenticated ? [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/chatbot", label: "Chatbot", icon: MessageCircle },
    { path: "/mind-games", label: "Mind Games", icon: Gamepad2 },
    { path: "/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/profile", label: "Profile", icon: User },
  ] : [
    { path: "/", label: "Home", icon: Home },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-lg bg-background/90">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-2xl font-display font-bold text-primary hover-elevate px-2 py-1 rounded-md transition-colors cursor-pointer" data-testid="link-home">
              ACHEIVE AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover-elevate cursor-pointer ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                    data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                </Link>
              );
            })}
            {authenticated ? (
              <Button
                variant="ghost"
                size="default"
                onClick={handleLogout}
                className="ml-2"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link href="/signin">
                <Button variant="default" className="ml-2" data-testid="button-signin">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover-elevate cursor-pointer ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                    data-testid={`link-mobile-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                </Link>
              );
            })}
            {authenticated && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
                data-testid="button-mobile-logout"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
