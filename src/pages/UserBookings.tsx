import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { bookingService } from '@/services/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, MapPin, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UserBookings = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const data = await bookingService.getUserBookings();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Unable to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);

  // Function to get stay image URL
  const getStayImageUrl = (stay: any) => {
    if (!stay || !stay.stay_images || stay.stay_images.length === 0) {
      return '/images/placeholder-stay.jpg';
    }
    
    const primaryImage = stay.stay_images.find((img: any) => img.is_primary) || stay.stay_images[0];
    const imagePath = primaryImage.image_path || '/images/placeholder-stay.jpg';
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle Supabase storage URLs
    if (imagePath.startsWith('stay-images/')) {
      return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${imagePath}`;
    }
    
    // For local paths, return as is
    return imagePath;
  };

  // Function to format date display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Function to get status variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
          
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <Card key={i} className="w-full h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
          
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (bookings.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
          
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">You don't have any bookings yet</h2>
            <p className="text-muted-foreground mb-6">
              When you book a stay, it will appear here.
            </p>
            <Button asChild>
              <Link to="/">Explore Stays</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
        
        <div className="space-y-6">
          {bookings.map((booking) => {
            const { stay } = booking;
            const checkInDate = new Date(booking.check_in_date);
            const checkOutDate = new Date(booking.check_out_date);
            const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={booking.id} className="p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img
                      src={getStayImageUrl(stay)}
                      alt={stay.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-xl font-semibold">{stay.title}</h2>
                        <p className="text-muted-foreground text-sm">
                          {stay.property_type} in {stay.location_name}
                        </p>
                      </div>
                      
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Check-in</p>
                          <p className="text-sm text-muted-foreground">{formatDate(booking.check_in_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Check-out</p>
                          <p className="text-sm text-muted-foreground">{formatDate(booking.check_out_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Guests</p>
                          <p className="text-sm text-muted-foreground">{booking.guest_count}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {nights} {nights === 1 ? 'night' : 'nights'} • ${booking.total_price}
                        </p>
                      </div>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/bookings/${booking.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserBookings; 