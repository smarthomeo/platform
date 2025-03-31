import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, Settings, CreditCard, Bell, Shield, 
  History, Heart, Calendar, Edit, Camera, Facebook, Mail, Loader2, ExternalLink
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from 'react-router-dom';

// Helper function to get full image URL
const getFullImageUrl = (url: string, type: 'stay' | 'food' | 'profile' = 'stay') => {
  if (!url) {
    // Return default images based on content type
    if (type === 'food') return '/images/jollof.jpg';
    if (type === 'profile') return '/images/kenji.jpg';
    return '/images/mountain.jpg';
  }
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) return url;
  
  // Handle Supabase storage URLs based on content type
  if (type === 'stay' && url.startsWith('stay-images/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  if (type === 'food' && url.startsWith('food-experience-images/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  if (type === 'profile' && url.startsWith('user-profiles/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  // For any other path, just return it (it might be a local path like /images/...)
  return url;
};

// Types for favorites
interface Favorite {
  id: string;
  item_type: 'stay' | 'food_experience';
  listing_id: string;
  title: string;
  price: string | number;
  image: string;
  created_at: string;
}

// Types for bookings
interface Booking {
  id: string;
  type: 'stay' | 'food_experience';
  title: string;
  date: string;
  status: string;
  image: string;
  listing_id: string;
}

// Google icon component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 12 h8"></path>
    <path d="M12 8 v8"></path>
  </svg>
);

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+1234567890",
    language: "English",
    currency: "USD",
    timezone: "UTC-5",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    marketingEmails: false,
    twoFactorAuth: false
  });

  // State for favorites and bookings
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Fetch user favorites from Supabase
  const fetchFavorites = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingFavorites(true);
      const formattedFavorites: Favorite[] = [];
      
      // 1. Get food experience favorites from the 'favorites' table
      const { data: foodFavoritesData, error: foodFavoritesError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('listing_type', 'food_experience');
        
      if (foodFavoritesError) throw foodFavoritesError;
      
      // 2. Get stay favorites from the 'user_favorites' table
      const { data: stayFavoritesData, error: stayFavoritesError } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id);
        
      if (stayFavoritesError) throw stayFavoritesError;
      
      // Process food experience favorites
      if (foodFavoritesData && foodFavoritesData.length > 0) {
        for (const fav of foodFavoritesData) {
          // Get food experience details
          const { data: foodData, error: foodError } = await supabase
            .from('food_experiences')
            .select('id, title, price_per_person, host_id')
            .eq('id', fav.listing_id)
            .single();
            
          if (foodError || !foodData) continue;
          
          // Get primary image for the food experience
          const { data: imageData, error: imageError } = await supabase
            .from('food_experience_images')
            .select('image_path')
            .eq('experience_id', fav.listing_id)
            .eq('is_primary', true)
            .single();
            
          const imagePath = imageData?.image_path || '';
          
          formattedFavorites.push({
            id: fav.id,
            item_type: 'food_experience',
            listing_id: fav.listing_id,
            title: foodData.title,
            price: `$${foodData.price_per_person}/person`,
            image: getFullImageUrl(imagePath, 'food'),
            created_at: fav.created_at
          });
        }
      }
      
      // Process stay favorites
      if (stayFavoritesData && stayFavoritesData.length > 0) {
        for (const fav of stayFavoritesData) {
          // Get stay details
          const { data: stayData, error: stayError } = await supabase
            .from('stays')
            .select('id, title, price_per_night, host_id')
            .eq('id', fav.stay_id)
            .single();
            
          if (stayError || !stayData) continue;
          
          // Get primary image for the stay
          const { data: imageData, error: imageError } = await supabase
            .from('stay_images')
            .select('image_path')
            .eq('stay_id', fav.stay_id)
            .eq('is_primary', true)
            .single();
            
          const imagePath = imageData?.image_path || '';
          
          formattedFavorites.push({
            id: fav.id,
            item_type: 'stay',
            listing_id: fav.stay_id,
            title: stayData.title,
            price: `$${stayData.price_per_night}/night`,
            image: getFullImageUrl(imagePath, 'stay'),
            created_at: fav.created_at
          });
        }
      }
      
      // Sort by most recently added
      formattedFavorites.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setFavorites(formattedFavorites);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Fetch user bookings from Supabase
  const fetchBookings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingBookings(true);
      
      // Get stay bookings
      const { data: stayBookingsData, error: stayBookingsError } = await supabase
        .from('stay_bookings')
        .select('id, stay_id, check_in_date, status, created_at')
        .eq('user_id', user.id)
        .order('check_in_date', { ascending: true });
        
      if (stayBookingsError) throw stayBookingsError;
      
      // Get food experience bookings
      const { data: foodBookingsData, error: foodBookingsError } = await supabase
        .from('food_experience_bookings')
        .select(`
          id, 
          experience_id, 
          status, 
          created_at,
          food_experience_availability!inner(date)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (foodBookingsError) throw foodBookingsError;
      
      const formattedBookings: Booking[] = [];
      
      // Process stay bookings
      if (stayBookingsData && stayBookingsData.length > 0) {
        for (const booking of stayBookingsData) {
          // Get stay details
          const { data: stayData, error: stayError } = await supabase
            .from('stays')
            .select('title')
            .eq('id', booking.stay_id)
            .single();
            
          if (stayError || !stayData) continue;
          
          // Get primary image for the stay
          const { data: imageData, error: imageError } = await supabase
            .from('stay_images')
            .select('image_path')
            .eq('stay_id', booking.stay_id)
            .eq('is_primary', true)
            .single();
            
          const imagePath = imageData?.image_path || '';
          
          formattedBookings.push({
            id: booking.id,
            type: 'stay',
            title: stayData.title,
            date: new Date(booking.check_in_date).toLocaleDateString(),
            status: booking.status,
            image: getFullImageUrl(imagePath, 'stay'),
            listing_id: booking.stay_id
          });
        }
      }
      
      // Process food experience bookings
      if (foodBookingsData && foodBookingsData.length > 0) {
        for (const booking of foodBookingsData) {
          // Get food experience details
          const { data: foodData, error: foodError } = await supabase
            .from('food_experiences')
            .select('title')
            .eq('id', booking.experience_id)
            .single();
            
          if (foodError || !foodData) continue;
          
          // Get primary image for the food experience
          const { data: imageData, error: imageError } = await supabase
            .from('food_experience_images')
            .select('image_path')
            .eq('experience_id', booking.experience_id)
            .eq('is_primary', true)
            .single();
            
          const imagePath = imageData?.image_path || '';
          
          // Get the booking date from the availability relationship
          const availabilityData = booking.food_experience_availability as any;
          const bookingDate = availabilityData?.date || new Date(booking.created_at).toLocaleDateString();
          
          formattedBookings.push({
            id: booking.id,
            type: 'food_experience',
            title: foodData.title,
            date: new Date(bookingDate).toLocaleDateString(),
            status: booking.status,
            image: getFullImageUrl(imagePath, 'food'),
            listing_id: booking.experience_id
          });
        }
      }
      
      // Sort by date (closest upcoming first)
      formattedBookings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const today = new Date();
        
        // If both dates are in the future
        if (dateA >= today && dateB >= today) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If one date is in the future and one is in the past
        if (dateA >= today && dateB < today) {
          return -1;
        }
        if (dateA < today && dateB >= today) {
          return 1;
        }
        
        // If both dates are in the past
        return dateB.getTime() - dateA.getTime();
      });
      
      setBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
      fetchBookings();
    }
  }, [user?.id]);

  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setIsLoading(true);

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}`;
      const filePath = `${user.id}/${fileName}.${fileExt}`;

      // First, check if the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'user-profiles');
      
      // Only create bucket if it doesn't exist
      if (!bucketExists) {
        try {
          await supabase.storage.createBucket('user-profiles', {
            public: true,
            fileSizeLimit: 5242880 // 5MB
          });
        } catch (bucketError) {
          console.log('Bucket may already exist, continuing:', bucketError);
          // Continue anyway as the bucket might exist but not be visible to this user
        }
      }

      // Upload file to user-profiles bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Use upsert to prevent conflicts
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL - ensure we're not duplicating the bucket name
      const { data } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        const avatarUrl = data.publicUrl;
        
        // 1. Update profiles table first (source of truth)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw new Error(`Profile update failed: ${updateError.message}`);
        }
        
        // 2. Update auth user metadata to keep in sync
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: { 
            avatar_url: avatarUrl,
            picture: avatarUrl
          }
        });
        
        if (userUpdateError) {
          console.error('Auth update error:', userUpdateError);
          // Continue anyway as the profile was updated
        }
        
        // 3. Wait for changes to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 4. Refresh user data
        await refreshUser();
        
        toast.success('Profile picture updated successfully');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      if (error.message?.includes('row-level security policy') || 
          error.message?.includes('Unauthorized')) {
        toast.error('Permission denied. Please log out and log back in to update your profile.');
      } else if (error.message?.includes('duplicate')) {
        toast.error('Image already exists. Please try with a different image.');
      } else {
        toast.error('Failed to update profile picture. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // 1. Update profiles table first (source of truth)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          name: profileData.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
      }
      
      // 2. Update auth user metadata to keep in sync
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
          name: profileData.name,
          full_name: profileData.name
        }
      });
      
      if (userUpdateError) {
        console.error('Auth update error:', userUpdateError);
        // Continue anyway as the profile was updated
      }
      
      // 3. Wait for changes to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. Refresh user data
      await refreshUser();
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.message?.includes('row-level security policy') || 
          error.message?.includes('Unauthorized')) {
        toast.error('Permission denied. Please log out and log back in to update your profile.');
      } else {
        toast.error('Failed to update profile. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      console.error('Error updating password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a favorite
  const handleRemoveFavorite = async (id: string, itemType: 'stay' | 'food_experience') => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      if (itemType === 'food_experience') {
        // Delete from the favorites table for food experiences
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else {
        // Delete from the user_favorites table for stays
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      // Update the local state
      setFavorites((prev) => prev.filter((item) => item.id !== id));
      toast.success('Removed from favorites');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove favorite');
      console.error('Error removing favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation to listing details
  const handleNavigateToListing = (type: 'stay' | 'food_experience', id: string) => {
    if (type === 'stay') {
      navigate(`/stays/${id}`);
    } else {
      navigate(`/food/${id}`);
    }
  };

  // Handle social account connection
  const handleConnectGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect Google account');
      console.error('Error connecting Google account:', error);
    }
  };

  const handleConnectFacebook = async () => {
    // Facebook OAuth (example, may not be supported by default in Supabase)
    toast.info('Facebook connection is not implemented yet');
  };

  // Handle toggle changes
  const handleToggleChange = (setting: keyof typeof preferences, value: boolean) => {
    setPreferences({ ...preferences, [setting]: value });
    // In a real app, you would save this to the database
    toast.success(`${setting} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.picture || user?.image || "/images/kenji.jpg"} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                  />
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
                  <p className="text-muted-foreground">{user?.email || "No email provided"}</p>
                  {user?.is_host && (
                    <div className="mt-2">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        Host
                      </span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="md:self-start"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Dialog */}
          {isEditing && (
            <Card className="mb-8 border-primary/50">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={profileData.email}
                      disabled
                      className="opacity-70"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Input 
                      value={profileData.language}
                      onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs defaultValue="bookings" className="space-y-4">
            <TabsList className="grid grid-cols-4 md:w-[400px]">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
              {isLoadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
              <div className="grid gap-4">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <Card key={booking.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={booking.image}
                          alt={booking.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                    {booking.type === 'stay' ? 'Stay' : 'Food Experience'}
                              </p>
                              <h3 className="font-semibold">{booking.title}</h3>
                              <p className="text-sm">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {booking.date}
                              </p>
                            </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : booking.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleNavigateToListing(
                                      booking.type as 'stay' | 'food_experience', 
                                      booking.listing_id
                                    )}
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground">You have no bookings yet.</p>
                  )}
              </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Your Favorites</h2>
              {isLoadingFavorites ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
              <div className="grid md:grid-cols-2 gap-4">
                  {favorites.length > 0 ? (
                    favorites.map((item) => (
                      <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                              className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                              onClick={() => handleNavigateToListing(item.item_type, item.listing_id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                                {item.item_type === 'stay' ? 'Stay' : 'Food Experience'}
                              </p>
                              <h3 
                                className="font-semibold hover:text-primary cursor-pointer"
                                onClick={() => handleNavigateToListing(item.item_type, item.listing_id)}
                              >
                                {item.title}
                              </h3>
                          <p className="text-sm font-medium">{item.price}</p>
                        </div>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => handleRemoveFavorite(item.id, item.item_type)}
                              disabled={isLoading}
                            >
                              {isLoading ? 
                                <Loader2 className="w-4 h-4 animate-spin" /> : 
                          <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                              }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground md:col-span-2">You have no favorites yet.</p>
                  )}
              </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={profileData.email}
                        disabled
                        className="opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Input 
                        value={profileData.language}
                        onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Preferences</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email about your bookings and account
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => handleToggleChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Communications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about new experiences and offers
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.marketingEmails}
                        onCheckedChange={(checked) => handleToggleChange('marketingEmails', checked)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Password</h3>
                    <Button 
                      variant="outline"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      Change Password
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable 2FA</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.twoFactorAuth}
                        onCheckedChange={(checked) => handleToggleChange('twoFactorAuth', checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Connected Accounts</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleConnectGoogle}
                      >
                        <GoogleIcon />
                        <span className="ml-2">Connect Google Account</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleConnectFacebook}
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="ml-2">Connect Facebook Account</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {user?.provider === 'google' ? (
              <p className="text-sm text-muted-foreground">
                You are signed in with Google. Please use Google to manage your password.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            {user?.provider !== 'google' && (
              <Button 
                onClick={handlePasswordChange} 
                disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Change Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Profile;
