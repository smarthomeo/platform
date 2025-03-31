import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string | number;
  author_id: string;
  user: {
    name: string;
    image?: string;
  };
  rating: number;
  content: string;
  created_at: string;
}

/**
 * Get average rating for a listing
 */
export async function getAverageRating(listingId: string, listingType: 'food_experience' | 'stay') {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('target_id', listingId)
    .eq('target_type', listingType);

  if (error) {
    console.error('Error fetching ratings:', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  return sum / data.length;
}

/**
 * Get reviews for a listing
 */
export async function getReviews(listingId: string, listingType: 'food_experience' | 'stay') {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      content,
      created_at,
      author_id,
      author:profiles!author_id(name, avatar_url)
    `)
    .eq('target_id', listingId)
    .eq('target_type', listingType)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return data.map((review: any) => ({
    id: review.id,
    author_id: review.author_id,
    user: {
      name: review.author?.name || 'Anonymous',
      image: review.author?.avatar_url || ''
    },
    rating: review.rating,
    content: review.content,
    created_at: review.created_at
  })) as Review[];
}

/**
 * Submit a review
 */
export async function submitReview(
  listingId: string, 
  listingType: 'food_experience' | 'stay',
  rating: number,
  content: string
) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      target_id: listingId,
      target_type: listingType,
      author_id: session.session.user.id,
      rating,
      content
    })
    .select();

  if (error) {
    console.error('Error submitting review:', error);
    throw error;
  }

  return data[0];
}

/**
 * Get review count for a listing
 */
export async function getReviewCount(listingId: string, listingType: 'food_experience' | 'stay') {
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: false })
    .eq('target_id', listingId)
    .eq('target_type', listingType);

  if (error) {
    console.error('Error counting reviews:', error);
    return 0;
  }

  return count || 0;
} 