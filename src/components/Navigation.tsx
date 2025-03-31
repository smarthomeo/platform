import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { memo } from "react";

// Using memo to prevent unnecessary re-renders 
const Navigation = memo(() => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            NativeBites
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.is_host ? (
                  <Link to="/host/dashboard">
                    <Button variant="outline">Host Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/become-host">
                    <Button variant="outline">Become a Host</Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
                <span className="text-sm font-medium">
                  {user.name}
                </span>
              </>
            ) : (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation; 