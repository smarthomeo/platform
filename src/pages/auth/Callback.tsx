import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the auth code from the URL
      const hash = window.location.hash;
      const query = new URLSearchParams(window.location.search);
      
      let errorDescription = query.get('error_description');
      
      if (errorDescription) {
        setError(errorDescription);
        toast.error(errorDescription);
        return;
      }
      
      try {
        // Let Supabase handle the auth exchange
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          toast.success('Successfully signed in!');
          navigate('/'); // Navigate to dashboard or homepage after login
        } else {
          navigate('/login'); // Navigate back to login if no session
        }
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.message || 'An error occurred during authentication');
        toast.error(err.message || 'Authentication failed');
        
        // Navigate back to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-red-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback; 