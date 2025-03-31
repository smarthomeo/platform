import { useState } from 'react';
import { Button } from '../ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FcGoogle } from 'react-icons/fc';

interface GoogleSignInButtonProps {
  redirectTo?: string;
  className?: string;
}

export const GoogleSignInButton = ({ 
  redirectTo = `${window.location.origin}/auth/callback`,
  className = ''
}: GoogleSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      // No need to handle success here as the user will be redirected
      // to the OAuth provider's login page
      console.log('Redirecting to Google auth...', data);
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleSignIn}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      <span>Continue with Google</span>
    </Button>
  );
};

export default GoogleSignInButton; 