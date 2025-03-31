import { Request, Response } from 'express';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get blocked dates for a specific stay
 * This includes dates that are already booked and dates marked as unavailable
 */
export async function getBlockedDates(req: Request, res: Response) {
  const { stayId } = req.params;
  
  try {
    // Get bookings for this stay with confirmed status
    const { data: bookings, error: bookingsError } = await supabase
      .from('stay_bookings')
      .select('check_in_date, check_out_date')
      .eq('stay_id', stayId)
      .eq('status', 'confirmed');
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch booking data' });
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
    
    // Combine both sets of blocked dates
    const blockedDates = {
      bookings: bookings || [],
      unavailableDates: unavailableDates || []
    };
    
    return res.status(200).json({ data: blockedDates });
  } catch (error) {
    console.error('Error in getBlockedDates:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Create a new booking
 */
export async function createBooking(req: Request, res: Response) {
  const { stayId, checkInDate, checkOutDate, guestCount } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to create a booking' });
  }
  
  if (!stayId || !checkInDate || !checkOutDate || !guestCount) {
    return res.status(400).json({ error: 'Missing required booking information' });
  }
  
  try {
    // Check if the dates are available
    // First, get any overlapping bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('stay_bookings')
      .select('id')
      .eq('stay_id', stayId)
      .eq('status', 'confirmed')
      .or(`check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate}`);
    
    if (bookingsError) {
      console.error('Error checking booking availability:', bookingsError);
      return res.status(500).json({ error: 'Failed to check availability' });
    }
    
    // If there are any overlapping bookings, the dates are not available
    if (existingBookings && existingBookings.length > 0) {
      return res.status(400).json({ error: 'The selected dates are not available' });
    }
    
    // Calculate the number of nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get the stay price
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('price_per_night, max_guests')
      .eq('id', stayId)
      .single();
    
    if (stayError || !stay) {
      console.error('Error fetching stay details:', stayError);
      return res.status(500).json({ error: 'Failed to fetch stay details' });
    }
    
    // Check if guest count exceeds max guests
    if (guestCount > stay.max_guests) {
      return res.status(400).json({ 
        error: `Guest count exceeds maximum allowed (${stay.max_guests})` 
      });
    }
    
    // Calculate total price
    const totalPrice = stay.price_per_night * nights;
    
    // Create the booking
    const { data: booking, error: createError } = await supabase
      .from('stay_bookings')
      .insert({
        stay_id: stayId,
        user_id: userId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_count: guestCount,
        status: 'confirmed',
        total_price: totalPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating booking:', createError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
    
    return res.status(201).json({ data: booking });
  } catch (error) {
    console.error('Error in createBooking:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Get all bookings for the current user
 */
export async function getUserBookings(req: Request, res: Response) {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to view your bookings' });
  }
  
  try {
    const { data, error } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        stay:stays(
          id,
          title,
          property_type,
          host_id,
          host:profiles!host_id(name, avatar_url),
          stay_images:stay_images(image_path, is_primary)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Get a specific booking by ID
 */
export async function getBookingById(req: Request, res: Response) {
  const { bookingId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to view booking details' });
  }
  
  try {
    const { data, error } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        stay:stays(
          id,
          title,
          description,
          price_per_night,
          host_id,
          host:profiles!host_id(name, avatar_url),
          stay_images:stay_images(image_path, is_primary),
          location_name,
          property_type,
          bedrooms,
          beds,
          bathrooms,
          max_guests
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (error) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({ error: 'Failed to fetch booking' });
    }
    
    // Check if the booking belongs to the current user
    if (data.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this booking' });
    }
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(req: Request, res: Response) {
  const { bookingId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'You must be logged in to cancel a booking' });
  }
  
  try {
    // First, check if the booking belongs to the user
    const { data: booking, error: fetchError } = await supabase
      .from('stay_bookings')
      .select('user_id, status')
      .eq('id', bookingId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching booking to cancel:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch booking details' });
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to cancel this booking' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }
    
    // Cancel the booking
    const { error: updateError } = await supabase
      .from('stay_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error cancelling booking:', updateError);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }
    
    return res.status(200).json({ 
      data: { success: true, message: 'Booking cancelled successfully' } 
    });
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}