import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { bookingService } from '@/services/bookingService';
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BookingConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      try {
        setLoading(true);
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Unable to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCancelBooking = async () => {
    if (!bookingId || !window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      await bookingService.cancelBooking(bookingId);
      // Refresh booking data
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again later.');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <Card className="p-8">
            <div className="flex items-center justify-center h-60 flex-col gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !booking) {
    return (
      <MainLayout>
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <Card className="p-8">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Booking not found'}
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/bookings">View All Bookings</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { stay } = booking;
  const checkInDate = new Date(booking.check_in_date);
  const checkOutDate = new Date(booking.check_out_date);
  const formattedCheckIn = format(checkInDate, 'EEE, MMM d, yyyy');
  const formattedCheckOut = format(checkOutDate, 'EEE, MMM d, yyyy');
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Find the primary image or use the first one
  const stayImages = stay.stay_images || [];
  const primaryImage = stayImages.find((img: any) => img.is_primary) || stayImages[0];
  const imagePath = primaryImage?.image_path || '/images/placeholder-stay.jpg';
  
  // Convert image path to full URL if needed
  const getFullImageUrl = (path: string) => {
    // If it's already a full URL, return it
    if (path.startsWith('http')) return path;
    
    // Handle Supabase storage URLs
    if (path.startsWith('stay-images/')) {
      return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${path}`;
    }
    
    // For local paths, return as is
    return path;
  };
  
  const imageUrl = getFullImageUrl(imagePath);
  
  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Booking Confirmation</h1>
            
            <Badge variant={booking.status === 'confirmed' ? 'default' : 'destructive'}>
              {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
            </Badge>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">{stay.title}</h2>
            <p className="text-muted-foreground">
              {stay.location_name} • {stay.property_type}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <img 
                src={imageUrl}
                alt={stay.title}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Your stay details</h3>
                <p>
                  {nights} {nights === 1 ? 'night' : 'nights'} • {booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm text-muted-foreground">Check-in</h4>
                <p>{formattedCheckIn}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-muted-foreground">Check-out</h4>
                <p>{formattedCheckOut}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-muted-foreground">Booked on</h4>
                <p>{format(new Date(booking.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Price Breakdown</h3>
            
            <div className="flex justify-between mb-4">
              <p>${stay.price_per_night} × {nights} nights</p>
              <p>${stay.price_per_night * nights}</p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between font-semibold">
              <p>Total</p>
              <p>${booking.total_price}</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-end mt-8">
            <Button variant="outline" asChild>
              <Link to="/bookings">View All Bookings</Link>
            </Button>
            
            {booking.status === 'confirmed' && (
              <Button variant="destructive" onClick={handleCancelBooking}>
                Cancel Booking
              </Button>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BookingConfirmation;