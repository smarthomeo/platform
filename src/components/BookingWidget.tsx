import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format, differenceInDays, isBefore, isAfter } from 'date-fns';
import { DateRange } from "react-day-picker";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '@/services/bookingService';
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface BookingWidgetProps {
  stayId: string;
  price: number;
  maxGuests: number;
}

const BookingWidget = ({ stayId, price, maxGuests }: BookingWidgetProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ 
    from: undefined, 
    to: undefined 
  });
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  
  // Fetch blocked dates for this stay
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        // Get existing bookings for this stay with confirmed status
        const { data: bookings, error: bookingsError } = await supabase
          .from('stay_bookings')
          .select('check_in_date, check_out_date')
          .eq('stay_id', stayId)
          .eq('status', 'confirmed');
        
        if (bookingsError) {
          console.error('Error fetching blocked dates:', bookingsError);
          return;
        }
        
        // Also check the stay_availability table for dates marked as unavailable
        const { data: unavailableDates, error: availabilityError } = await supabase
          .from('stay_availability')
          .select('date')
          .eq('stay_id', stayId)
          .eq('is_available', false);
        
        if (availabilityError) {
          console.error('Error fetching availability:', availabilityError);
          // Continue even if this check fails
        }
        
        // Convert the blocked date strings to Date objects
        if (bookings && bookings.length > 0) {
          const blockedDateObjects = bookings.flatMap((booking: any) => {
            const start = new Date(booking.check_in_date);
            const end = new Date(booking.check_out_date);
            
            // Generate an array of all dates between start and end (inclusive)
            const dates = [];
            let currentDate = start;
            
            while (currentDate <= end) {
              dates.push(new Date(currentDate));
              currentDate = addDays(currentDate, 1);
            }
            
            return dates;
          });
          
          // Add unavailable dates if any
          if (unavailableDates && unavailableDates.length > 0) {
            unavailableDates.forEach((dateObj: any) => {
              blockedDateObjects.push(new Date(dateObj.date));
            });
          }
          
          setBlockedDates(blockedDateObjects);
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };
    
    if (stayId) {
      fetchBlockedDates();
    }
  }, [stayId]);
  
  // Calculate nights and total price when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const nightsCount = differenceInDays(dateRange.to, dateRange.from);
      setNights(nightsCount);
      setTotalPrice(price * nightsCount);
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [dateRange, price]);
  
  // Handle guest count change
  const handleGuestChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    
    if (value < 1) {
      setGuests(1);
    } else if (value > maxGuests) {
      setGuests(maxGuests);
    } else {
      setGuests(value);
    }
  };
  
  // Handle date range change
  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setError('');
  };
  
  // Handle booking creation
  const handleBookNow = async () => {
    // Reset states
    setError('');
    setSuccess('');
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please login to book this stay'
        } 
      });
      return;
    }
    
    // Validate inputs
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select check-in and check-out dates');
      return;
    }
    
    if (guests < 1) {
      setError('Please select at least 1 guest');
      return;
    }
    
    if (nights < 1) {
      setError('You must book at least 1 night');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the booking
      const booking = await bookingService.createBooking({
        stay_id: stayId,
        check_in_date: format(dateRange.from, 'yyyy-MM-dd'),
        check_out_date: format(dateRange.to, 'yyyy-MM-dd'),
        guest_count: guests
      });
      
      setSuccess('Your booking has been confirmed!');
      setDateRange({ from: undefined, to: undefined });
      setGuests(1);
      
      // Redirect to the booking confirmation page
      setTimeout(() => {
        navigate(`/bookings/${booking.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="text-2xl font-semibold">
          ${price} <span className="text-sm font-normal text-muted-foreground">/ night</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="dates">Dates</Label>
          <DatePickerWithRange
            date={dateRange || { from: undefined, to: undefined }}
            onDateChange={handleDateChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="guests">Guests</Label>
          <Input
            id="guests"
            type="number"
            value={guests}
            onChange={handleGuestChange}
            min={1}
            max={maxGuests}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Maximum {maxGuests} guests allowed
          </p>
        </div>
      </div>
      
      {nights > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between">
            <span>${price} × {nights} nights</span>
            <span>${totalPrice}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${totalPrice}</span>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        className="w-full mt-6" 
        onClick={handleBookNow}
        disabled={isLoading || !dateRange?.from || !dateRange?.to || nights < 1}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : 'Reserve'}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground mt-2">
        You won't be charged yet
      </p>
    </Card>
  );
};

export default BookingWidget;