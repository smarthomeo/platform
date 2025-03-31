import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

// Schema for password validation
const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if the user has a valid reset token on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // This checks if the user is authenticated after clicking the reset password link
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          setValidToken(true);
        } else {
          setError("Invalid or expired password reset link. Please try again.");
        }
      } catch (err: any) {
        console.error("Error checking session:", err);
        setError("Something went wrong. Please try requesting a new password reset link.");
      }
    };
    
    checkSession();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    
    try {
      await updatePassword(values.password);
      setSubmitted(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-100 rounded-lg shadow-md">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-terracotta-600 flex items-center justify-center text-white font-bold text-xl">
              P25
            </div>
          </Link>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {submitted ? (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-500">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Password updated!</AlertTitle>
                <AlertDescription>
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-4">
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {!validToken ? (
                <div className="flex flex-col space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    The password reset link is invalid or has expired. Please request a new one.
                  </p>
                  <Link to="/forgot-password">
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-terracotta-600 text-white"
                    >
                      Request New Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-terracotta-600 text-white"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Reset Password"}
                      </Button>
                      
                      <Link to="/login">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center"
                          type="button"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Login
                        </Button>
                      </Link>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 