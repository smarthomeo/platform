import { supabase } from '@/integrations/supabase/client';
import type { FoodExperienceFilter } from '@/types/filters';
import type { FoodExperience } from '@/types/food';

/**
 * Fetch all published food experiences with optional filtering
 */
export async function getFoodExperiences(filters: Record<string, any> = {}) {
  try {
    // Get the current user session to check if they're the host
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    let query = supabase
      .from('food_experiences')
      .select(`
        *,
        images:food_experience_images(id, image_path, is_primary, display_order),
        host:profiles!host_id(name, avatar_url)
      `);
    
    // By default, fetch published experiences - but also include user's own experiences if logged in
    if (userId) {
      query = query.or(`status.eq.published,host_id.eq.${userId}`);
    } else {
      query = query.eq('status', 'published');
    }

    // Apply filters
    if (filters) {
      // Sort options
      if (filters.sort) {
        if (filters.sort === 'price_asc') {
          query = query.order('price_per_person', { ascending: true });
        } else if (filters.sort === 'price_desc') {
          query = query.order('price_per_person', { ascending: false });
        }
        // For rating sorting, we'll do post-processing after fetching all data
        // since the rating column isn't actually populated
      }

      // Filter by cuisine types
      if (filters.cuisine_types && filters.cuisine_types.length > 0) {
        if (Array.isArray(filters.cuisine_types)) {
          query = query.in('cuisine_type', filters.cuisine_types);
        } else if (typeof filters.cuisine_types === 'string') {
          query = query.in('cuisine_type', filters.cuisine_types.split(','));
        }
      }

      // Filter by title (search)
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }

      // Filter by zip code
      if (filters.zipcode) {
        query = query.eq('zipcode', filters.zipcode);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching food experiences:', error);
      return [];
    }

    // Process the data into the right format with actual review data
    const processedData = await Promise.all(data.map(async (experience) => {
      // Format images
      const images = experience.images?.map((img: any) => ({
        url: img.image_path,
        order: img.display_order || 0,
        is_primary: img.is_primary || false,
      })) || [];

      // Sort images by display_order with primary images first
      images.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.order - b.order;
      });

      // Get actual ratings and review count from reviews table
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_id', experience.id)
        .eq('target_type', 'food_experience');

      let averageRating = 0;
      let reviewCount = 0;

      if (!reviewsError && reviewsData) {
        reviewCount = reviewsData.length;
        if (reviewCount > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
          averageRating = parseFloat((totalRating / reviewCount).toFixed(1));
        }
      }

      // Format host data with actual rating
      const host = {
        id: experience.host_id,
        name: experience.host?.name || 'Host',
        image: experience.host?.avatar_url || '/default-avatar.png',
        rating: averageRating,
        reviews: reviewCount
      };

      // Create the formatted FoodExperience object
      return {
        id: experience.id,
        title: experience.title,
        description: experience.description,
        images: images,
        price_per_person: experience.price_per_person,
        cuisine_type: experience.cuisine_type,
        menu_description: experience.menu_description || '',
        location_name: experience.location_name,
        host: host,
        details: {
          duration: experience.duration || '2 hours',
          groupSize: `Max ${experience.max_guests} guests`,
          includes: ['Food', 'Beverages'],
          language: experience.language || 'English',
          location: `${experience.city}, ${experience.state}`,
        },
        coordinates: experience.latitude && experience.longitude
          ? { lat: experience.latitude, lng: experience.longitude }
          : undefined
      };
    }));

    // Apply post-processing sorting for ratings if needed - sort by actual ratings from reviews
    if (filters.sort === 'rating_desc') {
      processedData.sort((a, b) => b.host.rating - a.host.rating);
    } else if (filters.sort === 'rating_asc') {
      processedData.sort((a, b) => a.host.rating - b.host.rating);
    }

    return processedData;
  } catch (error) {
    console.error('Error in getFoodExperiences:', error);
    return [];
  }
}

/**
 * Fetch a single food experience by ID
 */
export async function getFoodExperienceById(id: string) {
  const { data, error } = await supabase
    .from('food_experiences')
    .select(`
      *,
      host_id,
      images:food_experience_images(id, image_path, is_primary, display_order),
      host:profiles!host_id(id, name, avatar_url, about),
      amenities:food_experience_amenities(
        amenity:amenities(id, name, category)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching food experience:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  // Process the images
  const images = data.images.map((img: any) => ({
    url: img.image_path,
    order: img.display_order || 0,
    is_primary: img.is_primary || false,
  }));

  // Sort images by display_order
  images.sort((a, b) => a.order - b.order);

  // Extract amenities
  const amenities = data.amenities.map((item: any) => item.amenity.name);

  // Get real ratings from reviews table
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('target_id', id)
    .eq('target_type', 'food_experience');

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
  }

  // Calculate average rating from real reviews or default to 5.0
  const reviews = reviewsData || [];
  const totalRating = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 5.0;
  const reviewCount = reviews.length;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    images: images,
    price_per_person: data.price_per_person,
    cuisine_type: data.cuisine_type,
    menu_description: data.menu_description || '',
    location_name: data.location_name,
    amenities: amenities,
    host: {
      id: data.host?.id,
      name: data.host?.name || 'Host',
      image: data.host?.avatar_url || '',
      rating: parseFloat(averageRating.toFixed(1)),
      reviews: reviewCount,
      about: data.host?.about || 'I love connecting with travelers and sharing unique experiences.'
    },
    details: {
      duration: data.duration || '2 hours',
      groupSize: `Max ${data.max_guests} guests`,
      includes: ['Food', 'Beverages'],
      language: data.language || 'English',
      location: `${data.city}, ${data.state}`,
    },
    coordinates: {
      lat: data.latitude,
      lng: data.longitude
    }
  } as FoodExperience;
}

/**
 * Fetch cuisine types with counts
 */
export async function getFoodCategories() {
  const { data, error } = await supabase
    .from('food_experiences')
    .select('cuisine_type')
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching food categories:', error);
    throw error;
  }

  // Count occurrences of each cuisine type
  const counts: Record<string, number> = {};
  data.forEach((item) => {
    const cuisine = item.cuisine_type;
    counts[cuisine] = (counts[cuisine] || 0) + 1;
  });

  // Format the data
  return Object.entries(counts).map(([cuisine_type, count]) => ({
    cuisine_type,
    count
  }));
}

/**
 * Check if a food experience is favorited by the current user
 */
export async function isFoodExperienceFavorited(experienceId: string) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    return false;
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('item_id', experienceId)
    .eq('item_type', 'food_experience')
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no rows are found

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking favorite status:', error);
    return false;
  }

  return !!data;
}

/**
 * Toggle favorite status for a food experience
 */
export async function toggleFoodExperienceFavorite(experienceId: string) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.session.user.id;

  // Check if already favorited
  const { data: existing, error: checkError } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', experienceId)
    .eq('item_type', 'food_experience')
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking favorite status:', checkError);
    throw checkError;
  }

  if (existing) {
    // Remove from favorites
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('Error removing favorite:', deleteError);
      throw deleteError;
    }

    return false; // Not favorited anymore
  } else {
    // Add to favorites
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        item_id: experienceId,
        item_type: 'food_experience'
      });

    if (insertError) {
      console.error('Error adding favorite:', insertError);
      throw insertError;
    }

    return true; // Now favorited
  }
} 