import { Link, useLocation } from "react-router-dom";
import { Leaf, LayoutDashboard, Home, LogOut, UserCircle, Shield, AlertTriangle, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

/**
 * Navbar Component
 * Clean minimal navigation
 */
const Navbar = () => {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const navLinks = [
    { path: "/", label: "Home", icon: Home, adminOnly: false },
    { path: "/report", label: "Report", icon: AlertTriangle, adminOnly: false },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    { path: "/transparency", label: "Stats", icon: Globe, adminOnly: false },
    { path: "/admin", label: "Admin", icon: Shield, adminOnly: true },
    { path: "/profile", label: "Profile", icon: UserCircle, adminOnly: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-semibold text-lg text-foreground">
              RevoCity
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks
              .filter((link) => !link.adminOnly || isAdmin)
              .map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{link.label}</span>
                  </Link>
                );
              })}

            {/* Notification Bell */}
            {user && <NotificationBell />}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Sign out */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
