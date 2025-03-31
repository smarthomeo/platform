import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ReviewUser {
  name?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  author_id: string;
  user?: ReviewUser;
}

interface ReviewsListProps {
  listingId: string;
  listingType: 'stay' | 'food_experience';
  refreshTrigger?: number;
}

const ReviewsList = ({ listingId, listingType, refreshTrigger = 0 }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            content,
            created_at,
            author_id
          `)
          .eq('target_id', listingId)
          .eq('target_type', listingType)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Fetch user info separately for each review
        if (data) {
          const reviewsWithUsers = await Promise.all(
            data.map(async (review) => {
              const { data: userData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', review.author_id)
                .single();
              
              return {
                ...review,
                user: userData || { 
                  name: 'Anonymous'
                }
              };
            })
          );
          
          setReviews(reviewsWithUsers);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId, listingType, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-6 text-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const name = review.user?.name || review.author_id.substring(0, 8) || 'Anonymous';
        const initials = name.charAt(0).toUpperCase();
        
        return (
          <div key={review.id} className="pb-6 last:pb-0 last:border-0">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
                />
              ))}
            </div>
            {review.content && (
              <p className="text-muted-foreground">{review.content}</p>
            )}
            <Separator className="mt-6" />
          </div>
        );
      })}
    </div>
  );
};

export default ReviewsList;
