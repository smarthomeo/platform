import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Clock, 
  Users, 
  MapPin, 
  ChefHat, 
  Globe, 
  Heart, 
  Share2, 
  Star, 
  Utensils, 
  MessageCircle,
  Loader2,
  Navigation,
  Info,
  Image as ImageIcon
} from "lucide-react";
import { ImageGallery } from "@/components/ImageGallery";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useLoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { ChatButton } from '@/components/chat/ChatButton';

// Import our services
import { getFoodExperienceById, isFoodExperienceFavorited, toggleFoodExperienceFavorite } from "@/services/foodExperienceService";
import { getAverageRating, getReviewCount } from "@/services/reviewService";
import type { FoodExperience } from "@/types/food";

// Define libraries as a constant to prevent reloading
const libraries: ['places'] = ['places'];

// Create a centralized Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDpB03uqoC8eWmdG8KRlBdiJaHWbXmtMgE';

const FoodDetails = () => {
  const { id } = useParams();
  const [experience, setExperience] = useState<FoodExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    id: 'google-map-script',
  });

  const getFullImageUrl = (url: string) => {
    if (!url) return '/default-food.jpg';
    if (url.startsWith('http')) return url;
    // If image is stored in Supabase Storage
    if (url.startsWith('food-experience-images/')) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${url}`;
    }
    return url;
  };

  useEffect(() => {
    const fetchExperience = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getFoodExperienceById(id);
        
        if (data) {
          // Process the images URLs
          const processedData = {
            ...data,
            images: data.images.map(img => ({
              ...img,
              url: getFullImageUrl(img.url)
            }))
          };
          
          setExperience(processedData);
          
          // Check if the experience is favorited
          const favorited = await isFoodExperienceFavorited(id);
          setIsFavorite(favorited);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviewStats = async () => {
      if (!id) return;
      
      try {
        const avgRating = await getAverageRating(id, 'food_experience');
        const numReviews = await getReviewCount(id, 'food_experience');
        
        setAverageRating(avgRating);
        setReviewCount(numReviews);
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };

    fetchExperience();
    fetchReviewStats();
  }, [id, reviewRefreshTrigger]);

  const refreshReviewStats = () => {
    setReviewRefreshTrigger(prev => prev + 1);
  };

  const toggleFavorite = async () => {
    if (!id) return;
    
    try {
      const newFavoriteStatus = await toggleFoodExperienceFavorite(id);
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageDialogOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading food details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!experience) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Food not found</h2>
          <p className="text-muted-foreground mb-8">The food you're looking for doesn't exist or has been removed.</p>
          <Button>Browse Foods</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{experience.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span>({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{experience.details.location}</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {experience.cuisine_type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={toggleFavorite}
                      className={isFavorite ? "text-red-500" : ""}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share this food</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="mb-12">
          {experience.images && experience.images.length > 0 && (
            <ImageGallery
              images={experience.images.map((img, index) => ({
                url: img.url,
                order: index,
                caption: `${experience.title} - Image ${index + 1}`
              }))}
              initialIndex={selectedImageIndex}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <div>
            <Tabs defaultValue="about" className="mb-12">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="host">Host</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-8">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">About this food</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {experience.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-6">
                    <ChefHat className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Cuisine Type</p>
                      <p className="text-sm text-muted-foreground">{experience.cuisine_type}</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="menu" className="space-y-8">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Menu</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {experience.menu_description}
                  </p>
                  
                  <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-5 h-5 text-primary" />
                      <p className="font-medium">Price</p>
                    </div>
                    <p className="text-lg font-semibold">${experience.price_per_person} per person</p>
                    <p className="text-sm text-muted-foreground mt-1">Pay directly to the host when you visit</p>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="host" className="space-y-8">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={experience.host.image} alt={experience.host.name} />
                      <AvatarFallback>{experience.host.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">Hosted by {experience.host.name}</h3>
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="font-medium">{experience.host.rating}</span>
                        <span className="text-muted-foreground ml-1">
                          ({experience.host.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    {experience.host.about || "I'm passionate about sharing authentic cuisine from my culture. I've been cooking traditional dishes for over 15 years and love meeting people from around the world who appreciate our food traditions."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ChatButton
                      hostId={experience.host?.id}
                      listingId={id || ''}
                      listingType="food_experience"
                      listingTitle={experience.title}
                      className="w-full"
                    >
                      Message Host
                    </ChatButton>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-8">
                <ReviewsSection 
                  listingId={id || ''} 
                  listingType="food_experience"
                  averageRating={averageRating}
                  reviewCount={reviewCount}
                  onReviewSubmitted={refreshReviewStats}
                />
              </TabsContent>
              
              <TabsContent value="location" className="space-y-8">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Location</h2>
                  <div className="mb-4">
                    <p className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="font-medium">{experience.details.location}</span>
                    </p>
                    <p className="text-muted-foreground ml-7">
                      Exact address will be provided after you contact the host
                    </p>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden mb-6 h-[300px]">
                    {!isLoaded ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : experience.coordinates ? (
                      <GoogleMap
                        zoom={14}
                        center={experience.coordinates}
                        mapContainerClassName="w-full h-full"
                        options={{
                          styles: [
                            {
                              featureType: "poi",
                              elementType: "labels",
                              stylers: [{ visibility: "off" }]
                            }
                          ]
                        }}
                      >
                        <MarkerF
                          position={experience.coordinates}
                          icon={{
                            url: '/images/food-marker.svg',
                            scaledSize: new google.maps.Size(40, 40)
                          }}
                        />
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-muted-foreground">Location coordinates not available</p>
                      </div>
                    )}
                  </div>
                  
                  {experience.coordinates && (
                    <div className="flex justify-center mb-4">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${experience.coordinates?.lat},${experience.coordinates?.lng}`, '_blank')}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  )}
                  
                  
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card className="p-6 sticky top-24 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-3xl font-bold">
                    ${experience.price_per_person}
                  </span>
                  <span className="text-muted-foreground ml-1">per person</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{experience.details.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Cuisine</p>
                    <p className="text-sm text-muted-foreground">{experience.cuisine_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Host</p>
                    <p className="text-sm text-muted-foreground">{experience.host.name}</p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 gap-3">
                <ChatButton
                  hostId={experience.host?.id}
                  listingId={id || ''}
                  listingType="food_experience"
                  listingTitle={experience.title}
                  variant="outline"
                >
                 
                  Message Host
                </ChatButton>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                Contact the host to arrange your visit
              </p>
            </Card>
            
            
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FoodDetails;
