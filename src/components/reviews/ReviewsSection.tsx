import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";
import { Star } from "lucide-react";

interface ReviewsSectionProps {
  listingId: string;
  listingType: 'stay' | 'food_experience';
  averageRating?: number;
  reviewCount?: number;
  onReviewSubmitted?: () => void;
}

const ReviewsSection = ({ 
  listingId, 
  listingType,
  averageRating = 0,
  reviewCount = 0,
  onReviewSubmitted
}: ReviewsSectionProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleReviewSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <div className="flex items-center">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mr-1" />
          <span className="font-medium text-lg">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground ml-1">
            ({reviewCount} reviews)
          </span>
        </div>
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">All Reviews</TabsTrigger>
          <TabsTrigger value="add">Write a Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <ReviewsList 
            listingId={listingId} 
            listingType={listingType}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
        
        <TabsContent value="add">
          <ReviewForm 
            listingId={listingId} 
            listingType={listingType}
            onSuccess={handleReviewSubmitted}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ReviewsSection;
