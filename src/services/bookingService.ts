import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, format } from 'date-fns';

// Types
export interface StayBooking {
  id?: string;
  stay_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Check if a stay is available for the specified date range
 */
export async function checkStayAvailability(
  stayId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<boolean> {
  try {
    console.log(`Checking availability for stay ${stayId} from ${checkInDate} to ${checkOutDate}`);
    
    // First, get all confirmed bookings for this stay
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('stay_bookings')
      .select('id, check_in_date, check_out_date')
      .eq('stay_id', stayId)
      .eq('status', 'confirmed');
    
    if (bookingsError) {
      console.error('Error checking booking availability:', bookingsError);
      throw bookingsError;
    }
    
    if (existingBookings && existingBookings.length > 0) {
      console.log(`Found ${existingBookings.length} existing bookings for this stay`, existingBookings);
      
      // Check for actual overlaps manually
      const requestedCheckIn = new Date(checkInDate);
      const requestedCheckOut = new Date(checkOutDate);
      
      // Check each booking for overlap
      for (const booking of existingBookings) {
        const bookedCheckIn = new Date(booking.check_in_date);
        const bookedCheckOut = new Date(booking.check_out_date);
        
        // Detect overlap - if one range doesn't entirely come before or after the other
        if (!(requestedCheckOut < bookedCheckIn || requestedCheckIn > bookedCheckOut)) {
          console.log(`Overlap detected with booking ${booking.id}:`, {
            requestedDates: {
              checkIn: checkInDate,
              checkOut: checkOutDate,
            },
            bookedDates: {
              checkIn: booking.check_in_date,
              checkOut: booking.check_out_date,
            }
          });
          return false;
        }
      }
    }
    
    // As a second check, look at stay_availability table (if used)
    // This table can be used by hosts to manually block dates
    const { data: unavailableDates, error: availabilityError } = await supabase
      .from('stay_availability')
      .select('date')
      .eq('stay_id', stayId)
      .eq('is_available', false)
      .gte('date', checkInDate)
      .lte('date', checkOutDate);
    
    if (availabilityError) {
      console.error('Error checking date availability:', availabilityError);
      // Continue even if this check fails
    }
    
    // If there are any dates marked as unavailable in the range, the stay is not available
    if (unavailableDates && unavailableDates.length > 0) {
      console.log(`Found ${unavailableDates.length} unavailable dates, stay is not available`);
      return false;
    }
    
    // If we passed both checks, the stay is available for the requested dates
    console.log('Stay is available for the requested dates');
    return true;
  } catch (error) {
    console.error('Error in checkStayAvailability:', error);
    throw error;
  }
}

/**
 * Calculate the total price for a stay booking
 */
export async function calculateBookingPrice(
  stayId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<number> {
  try {
    // Fetch the base price per night for the stay
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('price_per_night')
      .eq('id', stayId)
      .single();
    
    if (stayError) {
      console.error('Error fetching stay details for pricing:', stayError);
      throw stayError;
    }
    
    // Calculate the number of nights
    const nights = differenceInDays(parseISO(checkOutDate), parseISO(checkInDate));
    
    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date');
    }
    
    // Start with the base price
    let totalPrice = stay.price_per_night * nights;
    
    // Check for any custom pricing in the stay_availability table
    const { data: customPricing, error: pricingError } = await supabase
      .from('stay_availability')
      .select('date, price_override')
      .eq('stay_id', stayId)
      .gte('date', checkInDate)
      .lte('date', checkOutDate)
      .not('price_override', 'is', null);
    
    if (pricingError) {
      console.error('Error fetching custom pricing:', pricingError);
      // Continue with base pricing if this check fails
    }
    
    // Apply any custom pricing
    if (customPricing && customPricing.length > 0) {
      customPricing.forEach(day => {
        // Subtract the base price and add the custom price for this day
        totalPrice = totalPrice - stay.price_per_night + day.price_override;
      });
    }
    
    // Return the total price (rounded to 2 decimal places)
    return Math.round(totalPrice * 100) / 100;
  } catch (error) {
    console.error('Error in calculateBookingPrice:', error);
    throw error;
  }
}

/**
 * Create a new booking for a stay
 */
export async function createBooking(bookingData: {
  stay_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
}): Promise<StayBooking> {
  try {
    // Get the current user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // First, check if the stay is available for the requested dates
    const isAvailable = await checkStayAvailability(
      bookingData.stay_id,
      bookingData.check_in_date,
      bookingData.check_out_date
    );
    
    if (!isAvailable) {
      throw new Error('Stay is not available for the selected dates');
    }
    
    // Calculate the total price
    const totalPrice = await calculateBookingPrice(
      bookingData.stay_id,
      bookingData.check_in_date,
      bookingData.check_out_date
    );
    
    // Create the booking
    const { data, error } = await supabase
      .from('stay_bookings')
      .insert({
        stay_id: bookingData.stay_id,
        user_id: userId,
        check_in_date: bookingData.check_in_date,
        check_out_date: bookingData.check_out_date,
        guest_count: bookingData.guest_count,
        status: 'confirmed', // Automatically confirm since we're not doing payments
        total_price: totalPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
    
    console.log(`Successfully created booking with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
}

/**
 * Get all bookings for the current user
 */
export async function getUserBookings(): Promise<StayBooking[]> {
  try {
    // Get the current user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // Fetch the user's bookings
    const { data, error } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        stay:stays(
          id,
          title,
          host_id,
          host:profiles!host_id(name, avatar_url),
          stay_images:stay_images(image_path, is_primary)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    throw error;
  }
}

/**
 * Get a specific booking by ID
 */
export async function getBookingById(bookingId: string): Promise<StayBooking | null> {
  try {
    // Get the current user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // Fetch the booking
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
      throw error;
    }
    
    // Verify the booking belongs to the current user
    if (data.user_id !== userId) {
      console.error('Booking does not belong to current user');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getBookingById:', error);
    throw error;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<boolean> {
  try {
    // Get the current user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // First, check if the booking belongs to the current user
    const { data: booking, error: fetchError } = await supabase
      .from('stay_bookings')
      .select('user_id, status')
      .eq('id', bookingId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching booking to cancel:', fetchError);
      throw fetchError;
    }
    
    // Verify ownership and that the booking isn't already cancelled
    if (booking.user_id !== userId) {
      throw new Error('You do not have permission to cancel this booking');
    }
    
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }
    
    // Update the booking status to cancelled
    const { error: updateError } = await supabase
      .from('stay_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error cancelling booking:', updateError);
      throw updateError;
    }
    
    console.log(`Successfully cancelled booking with ID: ${bookingId}`);
    return true;
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
}

/**
 * Get bookings for a specific stay (host only)
 */
export async function getStayBookings(stayId: string): Promise<StayBooking[]> {
  try {
    // Get the current user session
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const userId = session.session.user.id;
    
    // First, check if the current user is the host of the stay
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('host_id')
      .eq('id', stayId)
      .single();
    
    if (stayError) {
      console.error('Error fetching stay details:', stayError);
      throw stayError;
    }
    
    if (stay.host_id !== userId) {
      throw new Error('You do not have permission to view bookings for this stay');
    }
    
    // Fetch the bookings for the stay
    const { data, error } = await supabase
      .from('stay_bookings')
      .select(`
        *,
        guest:profiles!user_id(name, avatar_url)
      `)
      .eq('stay_id', stayId)
      .order('check_in_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching stay bookings:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getStayBookings:', error);
    throw error;
  }
}

// Export the service as an object for easy importing
export const bookingService = {
  checkStayAvailability,
  calculateBookingPrice,
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getStayBookings
};

export default bookingService; 