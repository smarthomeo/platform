import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';

// Types
export interface Stay {
  id: string;
  title: string;
  description: string;
  image?: string;
  images: { url: string; order?: number }[];
  price_per_night: number;
  host: {
    id?: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    about?: string;
  };
  host_id: string;
  details: {
    bedrooms: number;
    beds: number;
    bathrooms: number;
    maxGuests: number;
    amenities: string[];
    location: string;
    propertyType?: string;
  };
  availability?: {
    date: string;
    price: number;
    is_available: boolean;
  }[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  status?: string;
  is_featured?: boolean;
}

// Define types for Supabase responses
interface UserProfile {
  id?: string;
  name: string;
  avatar_url: string | null;
}

interface StayImage {
  id?: string;
  image_path: string;
  is_primary?: boolean;
  display_order?: number;
}

interface StayReview {
  rating: number;
}

interface StayFromDB {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  status: string;
  property_type: string | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[] | string | null;
  location_name: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  host_id: string;
  is_featured?: boolean;
  host: UserProfile | UserProfile[];
  stay_images: StayImage[];
  stay_reviews?: StayReview[];
  stay_amenities?: { 
    amenity_id: string; 
    amenities?: { 
      id: string; 
      name: string 
    }
  }[];
}

// Helper function to get full image URL
const getFullImageUrl = (url: string) => {
  if (!url) return `/images/placeholder-stay.jpg`;
  if (url.startsWith('http')) return url;
  // Handle Supabase storage URLs
  if (url.startsWith('stay-images/')) {
    return `https://bbrgntyiwuniovyoryta.supabase.co/storage/v1/object/public/${url}`;
  }
  return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
};

// Helper function to generate availability for the next 30 days
// This will be replaced with real availability data when available
const generateAvailability = (basePrice: number) => {
  const availability = [];
  const startDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = addDays(startDate, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Price variation for weekends
    let price = basePrice;
    if (isWeekend) price += Math.round(basePrice * 0.25); // 25% more on weekends
    
    availability.push({
      date: format(date, 'yyyy-MM-dd'),
      price,
      is_available: true
    });
  }
  
  return availability;
};

// Service functions
export const stayService = {
  // Get all stays with filtering options
  async getStays(options: {
    search?: string;
    zipcode?: string;
    location?: string;
    sort?: string;
    limit?: number;
    propertyType?: string[];
    bedrooms?: string;
    maxGuests?: string;
  } = {}): Promise<Stay[]> {
    try {
      console.log('Fetching stays with options:', options);
      
      // Try to fetch from Supabase
      let query = supabase
        .from('stays')
        .select(`
          id, 
          title, 
          description, 
          price_per_night,
          status,
          property_type,
          bedrooms,
          beds,
          bathrooms,
          max_guests,
          amenities,
          location_name,
          zipcode,
          latitude,
          longitude,
          host_id,
          host:profiles!host_id(id, name, avatar_url),
          stay_images:stay_images(id, image_path, is_primary, display_order),
          stay_amenities:stay_amenities(amenity_id, amenities:amenities(id, name))
        `)
        .eq('status', 'published');
      
      // Apply filters
      if (options.zipcode) {
        query = query.eq('zipcode', options.zipcode);
      }
      
      if (options.location) {
        query = query.ilike('location_name', `%${options.location}%`);
      }
      
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%,location_name.ilike.%${options.search}%`);
      }
      
      if (options.propertyType && options.propertyType.length > 0) {
        query = query.in('property_type', options.propertyType);
      }
      
      // Sorting
      if (options.sort) {
        switch (options.sort) {
          case 'price_asc':
            query = query.order('price_per_night', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price_per_night', { ascending: false });
            break;
          default:
            query = query.order('id', { ascending: true });
            break;
        }
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching stays:', error);
        throw new Error('Failed to fetch stays');
      }
      
      if (!data || data.length === 0) {
        console.log('No stays found in database');
        return [];
      }
      
      // Process the data into the right format with actual review data
      const processedData = await Promise.all(data.map(async (stayData) => {
        // Get the host profile data
        const hostProfile = stayData.host && Array.isArray(stayData.host) ? stayData.host[0] : stayData.host;
        const userProfile = hostProfile || { name: 'Host', avatar_url: '' };
        
        const stayImages = Array.isArray(stayData.stay_images) ? stayData.stay_images : [];
        
        // Get real ratings and review count from reviews table
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('target_id', stayData.id)
          .eq('target_type', 'stay');

        let averageRating = 0;
        let reviewCount = 0;

        if (!reviewsError && reviewsData) {
          reviewCount = reviewsData.length;
          if (reviewCount > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
            averageRating = parseFloat((totalRating / reviewCount).toFixed(1));
          }
        } else {
          averageRating = 4.7; // Default if no reviews
        }
        
        // Find primary image or use the first one
        const primaryImage = stayImages.find(img => img.is_primary) || stayImages[0];
        
        // Parse amenities - handle cases where it might be a string, array, or null
        let amenitiesArray: string[] = [];
        if (stayData.amenities) {
          if (Array.isArray(stayData.amenities)) {
            amenitiesArray = stayData.amenities;
          } else if (typeof stayData.amenities === 'string') {
            try {
              // Try parsing if it's a JSON string
              const parsed = JSON.parse(stayData.amenities);
              amenitiesArray = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              // If not valid JSON, split by comma if it's a comma-separated string
              amenitiesArray = stayData.amenities.split(',').map(item => item.trim());
            }
          }
        }
        
        // Default amenities if none are provided
        if (amenitiesArray.length === 0) {
          amenitiesArray = ['Wi-Fi', 'Kitchen'];
        }
        
        // Process the images
        const processedImages = stayImages
          .map(img => ({
            url: getFullImageUrl(img.image_path),
            order: img.display_order || 0
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // If no images are found, add a placeholder
        if (processedImages.length === 0) {
          processedImages.push({
            url: '/images/mountain.jpg',
            order: 0
          });
        }
        
        return {
          id: stayData.id,
          title: stayData.title,
          description: stayData.description,
          price_per_night: stayData.price_per_night,
          status: stayData.status,
          images: processedImages,
          image: stayImages.length > 0 
            ? getFullImageUrl(primaryImage?.image_path || '') 
            : processedImages[0].url,
          host: {
            id: stayData.host_id,
            name: userProfile.name || 'Host',
            image: getFullImageUrl(userProfile.avatar_url || ''),
            rating: averageRating,
            reviews: reviewCount
          },
          host_id: stayData.host_id,
          details: {
            bedrooms: stayData.bedrooms || 1,
            beds: stayData.beds || 1,
            bathrooms: stayData.bathrooms || 1,
            maxGuests: stayData.max_guests || 2,
            amenities: amenitiesArray,
            location: stayData.location_name || 'Unknown location',
            propertyType: stayData.property_type || 'apartment'
          },
          coordinates: {
            lat: stayData.latitude || 0,
            lng: stayData.longitude || 0
          },
          // Generate availability for now - will be replaced with real data later
          availability: generateAvailability(stayData.price_per_night)
        };
      }));
      
      console.log(`Returning ${processedData.length} stays from database`);
      
      // Apply post-processing sorting for ratings if needed
      if (options.sort === 'rating_desc') {
        processedData.sort((a, b) => b.host.rating - a.host.rating);
      }
      
      return processedData;
    } catch (error) {
      console.error('Error in getStays:', error);
      throw error;
    }
  },
  
  // Get a specific stay by ID
  async getStayById(id: string): Promise<Stay | null> {
    try {
      // Get stay data with related records
      const { data, error } = await supabase
        .from('stays')
        .select(`
          id, 
          title, 
          description, 
          price_per_night,
          status,
          property_type,
          bedrooms,
          beds,
          bathrooms,
          max_guests,
          amenities,
          location_name,
          zipcode,
          latitude,
          longitude,
          host_id,
          host:profiles!host_id(id, name, avatar_url, about),
          stay_images:stay_images(id, image_path, is_primary, display_order),
          stay_amenities:stay_amenities(amenity_id, amenities:amenities(id, name))
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching stay:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Get real ratings from reviews table
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_id', id)
        .eq('target_type', 'stay');

      let averageRating = 0;
      let reviewCount = 0;

      if (!reviewsError && reviewsData) {
        reviewCount = reviewsData.length;
        if (reviewCount > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          averageRating = parseFloat((totalRating / reviewCount).toFixed(1));
        }
      } else {
        averageRating = 4.7; // Default if no reviews
      }
      
      // Process stay images
      const stayImages = Array.isArray(data.stay_images) ? data.stay_images : [];
      
      // Sort by display_order if available
      stayImages.sort((a, b) => {
        if (a.display_order !== undefined && b.display_order !== undefined) {
          return a.display_order - b.display_order;
        }
        return 0;
      });
      
      // Map to our simplified image format with full URLs
      const images = stayImages.map(img => ({
        url: getFullImageUrl(img.image_path),
        order: img.display_order
      }));
      
      // Get amenities
      let amenities: string[] = [];
      
      if (data.stay_amenities && Array.isArray(data.stay_amenities)) {
        amenities = data.stay_amenities
          .filter(item => item.amenities && item.amenities.name)
          .map(item => item.amenities.name);
      }
      
      if (amenities.length === 0 && data.amenities) {
        // Try parsing from the amenities field if stay_amenities is empty
        if (Array.isArray(data.amenities)) {
          amenities = data.amenities;
        } else if (typeof data.amenities === 'string') {
          try {
            const parsed = JSON.parse(data.amenities);
            amenities = Array.isArray(parsed) ? parsed : [data.amenities];
          } catch (e) {
            amenities = data.amenities.split(',').map(a => a.trim());
          }
        }
      }
      
      // If still empty, add some default amenities
      if (amenities.length === 0) {
        amenities = ['WiFi', 'Kitchen', 'TV', 'Air conditioning'];
      }
      
      // Get host data
      const host = data.host ?? { name: 'Host Name', avatar_url: '', about: 'I love connecting with travelers and sharing unique experiences.' };
      
      // Generate availability for demo purposes
      const availability = generateAvailability(data.price_per_night || 100);
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        images: images,
        price_per_night: data.price_per_night,
        host_id: data.host_id,
        host: {
          id: host.id,
          name: host.name,
          image: host.avatar_url || '/placeholder-user.jpg',
          rating: averageRating,
          reviews: reviewCount,
          about: host.about || 'I love connecting with travelers and sharing unique experiences.'
        },
        details: {
          bedrooms: data.bedrooms || 1,
          beds: data.beds || 1,
          bathrooms: data.bathrooms || 1,
          maxGuests: data.max_guests || 2,
          amenities: amenities,
          location: data.location_name || 'Location unavailable',
          propertyType: data.property_type || 'Entire home'
        },
        availability: availability,
        coordinates: data.latitude && data.longitude 
          ? { lat: data.latitude, lng: data.longitude }
          : undefined,
        status: data.status,
        is_featured: data.is_featured
      };
    } catch (error) {
      console.error('Error fetching stay details:', error);
      return null;
    }
  },
  
  // Get featured stays for homepage
  async getFeaturedStays(limit = 3): Promise<Stay[]> {
    try {
      console.log(`Fetching ${limit} featured stays`);
      
      // Try to fetch featured stays from Supabase
      const { data, error } = await supabase
        .from('stays')
        .select(`
          id, 
          title, 
          description, 
          price_per_night,
          property_type,
          bedrooms,
          beds,
          bathrooms,
          max_guests,
          location_name,
          host_id,
          host:profiles!host_id(id, name, avatar_url),
          stay_images:stay_images(id, image_path, is_primary, display_order),
          stay_amenities:stay_amenities(amenity_id, amenities:amenities(id, name))
        `)
        .eq('is_featured', true)
        .eq('status', 'published')
        .limit(limit);
      
      if (error) {
        console.error('Error fetching featured stays:', error);
        throw new Error('Failed to fetch featured stays');
      }
      
      if (!data || data.length === 0) {
        console.log('No featured stays found');
        return [];
      }
      
      // Process the data into the right format with actual review data
      const processedData = await Promise.all(data.map(async (stayData: any) => {
        // Get the host profile data
        let hostData: any = stayData.host;
        if (Array.isArray(hostData) && hostData.length > 0) {
          hostData = hostData[0];
        }
        
        const userProfile = {
          id: (hostData && hostData.id) || undefined,
          name: (hostData && hostData.name) || 'Host',
          avatar_url: (hostData && hostData.avatar_url) || null
        };
        
        const stayImages = Array.isArray(stayData.stay_images) ? stayData.stay_images : [];
        
        // Get real ratings and review count from reviews table
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('target_id', stayData.id)
          .eq('target_type', 'stay');

        let averageRating = 0;
        let reviewCount = 0;

        if (!reviewsError && reviewsData) {
          reviewCount = reviewsData.length;
          if (reviewCount > 0) {
            const totalRating = reviewsData.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
            averageRating = parseFloat((totalRating / reviewCount).toFixed(1));
          }
        }
        
        if (averageRating === 0) {
          averageRating = 4.7; // Default if no reviews
        }
        
        // Find primary image or use the first one
        const primaryImage = stayImages.find((img: any) => img.is_primary) || stayImages[0];
        
        // Parse amenities from stay_amenities
        let amenitiesArray: string[] = [];
        if (stayData.stay_amenities && Array.isArray(stayData.stay_amenities)) {
          amenitiesArray = stayData.stay_amenities
            .filter((item: any) => item.amenities && typeof item.amenities === 'object')
            .map((item: any) => {
              if (item.amenities && 'name' in item.amenities) {
                return String(item.amenities.name);
              }
              return '';
            })
            .filter(Boolean);
        }
        
        // Default amenities if none are provided
        if (amenitiesArray.length === 0) {
          amenitiesArray = ['Wi-Fi', 'Kitchen'];
        }
        
        // Process the image URLs into our desired format
        const processedImages = stayImages
          .map((img: any) => ({
            url: getFullImageUrl(img.image_path),
            order: img.display_order || 0
          }))
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          
        // If no images are found, add a placeholder image
        if (processedImages.length === 0) {
          processedImages.push({
            url: '/images/mountain.jpg',
            order: 0
          });
        }
        
        return {
          id: stayData.id,
          title: stayData.title,
          description: stayData.description,
          price_per_night: stayData.price_per_night,
          images: processedImages,
          image: stayImages.length > 0 
            ? getFullImageUrl(primaryImage?.image_path || '') 
            : processedImages[0].url,
          host: {
            id: userProfile.id,
            name: userProfile.name,
            image: getFullImageUrl(userProfile.avatar_url || ''),
            rating: averageRating,
            reviews: reviewCount
          },
          host_id: stayData.host_id,
          details: {
            bedrooms: stayData.bedrooms || 1,
            beds: stayData.beds || 1,
            bathrooms: stayData.bathrooms || 1,
            maxGuests: stayData.max_guests || 2,
            amenities: amenitiesArray,
            location: stayData.location_name || 'Unknown location',
            propertyType: stayData.property_type || 'apartment'
          },
          availability: generateAvailability(stayData.price_per_night)
        };
      }));
      
      // Sort featured stays by rating (highest first)
      processedData.sort((a, b) => b.host.rating - a.host.rating);
      
      return processedData;
    } catch (error) {
      console.error('Error in getFeaturedStays:', error);
      throw error;
    }
  },
  
  // Toggle favorite status for a stay (would normally save to user's favorites in DB)
  async toggleFavorite(stayId: string, userId: string): Promise<boolean> {
    try {
      console.log(`Toggling favorite for stay ID: ${stayId} and user ID: ${userId}`);
      
      // Check if the stay is already a favorite
      const { data: existingFavorite, error: checkError } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('stay_id', stayId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking favorite status:', checkError);
        return false;
      }
      
      // If it exists, remove it
      if (existingFavorite) {
        const { error: deleteError } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existingFavorite.id);
        
        if (deleteError) {
          console.error('Error removing favorite:', deleteError);
          return false;
        }
        
        console.log(`Removed stay ID: ${stayId} from favorites`);
        return true;
      }
      
      // If it doesn't exist, add it
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          stay_id: stayId,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error adding favorite:', insertError);
        return false;
      }
      
      console.log(`Added stay ID: ${stayId} to favorites`);
      return true;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  },
  
  // Get user's favorite stays
  async getFavorites(userId: string): Promise<string[]> {
    try {
      console.log(`Fetching favorites for user ID: ${userId}`);
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('stay_id')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
      
      return data.map(fav => fav.stay_id);
    } catch (error) {
      console.error('Error in getFavorites:', error);
      return [];
    }
  }
};

export default stayService; 