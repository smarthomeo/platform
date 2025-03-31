import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bed, 
  Bath, 
  Users, 
  MapPin, 
  Home, 
  Wifi, 
  Heart, 
  Share2, 
  Star, 
  MessageCircle,
  Loader2,
  Phone,
  Navigation,
  Info,
  Image as ImageIcon
} from "lucide-react";
import { ImageGallery } from "@/components/ImageGallery";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
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
import { useLoadScript, GoogleMap, MarkerF, Libraries } from '@react-google-maps/api';
import { stayService, type Stay } from "@/services/stayService";
import { useAuth } from "@/contexts/AuthContext";
import { ChatButton } from '@/components/chat/ChatButton';
import BookingWidget from "@/components/BookingWidget";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { getAverageRating, getReviewCount } from "@/services/reviewService";
import { apiService } from "@/services/api";
// Define libraries as a constant outside the component to prevent re-creation on each render
const mapLibraries: Libraries = ['places'];

// Create a centralized Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDpB03uqoC8eWmdG8KRlBdiJaHWbXmtMgE';

const StayDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [stay, setStay] = useState<Stay | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  
  // Google Maps API loading with static libraries array
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: mapLibraries,
    id: 'google-map-script'
  });
  
  // Get location coordinates from the stay data
  const locationCoords = stay?.coordinates || {
    lat: 40.7128,
    lng: -74.0060
  };

  // Helper function to get full image URL
  const getFullImageUrl = (url: string) => {
    if (!url) return '/placeholder-stay.jpg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
  };

  // Fetch the stay data
  useEffect(() => {
    const fetchStay = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await stayService.getStayById(id);
        if (data) {
          setStay(data);
          console.log('Fetched stay data:', data);
        }
      } catch (error) {
        console.error('Error fetching stay:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStay();
  }, [id]);

  // Fetch review data
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!id) return;
      
      try {
        const avgRating = await getAverageRating(id, 'stay');
        const numReviews = await getReviewCount(id, 'stay');
        
        setAverageRating(avgRating);
        setReviewCount(numReviews);
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };

    fetchReviewStats();
  }, [id, reviewRefreshTrigger]);

  const refreshReviewStats = () => {
    setReviewRefreshTrigger(prev => prev + 1);
  };

  // Check if the stay is in user's favorites - using a ref to prevent multiple fetches
  const favoritesChecked = useRef(false);
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user?.id && id && !favoritesChecked.current) {
        try {
          favoritesChecked.current = true; // Mark as checked to prevent repeated calls
          const favorites = await stayService.getFavorites(user.id);
          setIsFavorite(favorites.includes(id));
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!id) return;
    
    if (user?.id) {
      try {
        const success = await stayService.toggleFavorite(id, user.id);
        if (success) {
          setIsFavorite(!isFavorite);
          // Reset the ref if the user manually toggles a favorite
          favoritesChecked.current = true;
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    } else {
      // If no user is logged in, just toggle the UI state
      // In a real app, this would prompt a login
      setIsFavorite(!isFavorite);
    }
  };

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageDialogOpen(true);
  };

  // Find the price for the selected date
  const getSelectedDatePrice = () => {
    if (!stay?.availability || !selectedDate) return null;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return stay.availability.find(a => a.date === dateString);
  };

  const selectedDateInfo = getSelectedDatePrice();

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading stay details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!stay) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay not found</h2>
          <p className="text-muted-foreground mb-8">The stay you're looking for doesn't exist or has been removed.</p>
          <Button>Browse Stays</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{stay.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span>({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{stay.details.location}</span>
                </div>
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
                    <p>Share this stay</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Enhanced Image Gallery - Compact Version */}
        <div className="mb-12">
          {stay.images && stay.images.length > 0 && (
            <ImageGallery
              images={stay.images.map((img, index) => ({
                url: typeof img === 'string' ? getFullImageUrl(img) : getFullImageUrl(img.url),
                order: index,
                caption: `${stay.title} - Image ${index + 1}`
              }))}
              initialIndex={selectedImageIndex}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left Column */}
          <div>
            <Tabs defaultValue="about" className="mb-12">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="host">Host</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-8">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">About this place</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {stay.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <Bed className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Bedrooms</p>
                        <p className="text-sm text-muted-foreground">{stay.details.bedrooms}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Bathrooms</p>
                        <p className="text-sm text-muted-foreground">{stay.details.bathrooms}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Max Guests</p>
                        <p className="text-sm text-muted-foreground">{stay.details.maxGuests}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Property Type</p>
                        <p className="text-sm text-muted-foreground">{stay.details.propertyType || 'Entire home'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="amenities" className="space-y-8">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">What this place offers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(stay.details.amenities) ? 
                      stay.details.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/5">
                          <Wifi className="w-5 h-5 text-primary" />
                          <span>{amenity}</span>
                        </div>
                      )) : 
                      <div className="col-span-2 text-center text-muted-foreground py-4">
                        No amenities listed for this property.
                      </div>
                    }
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="host" className="space-y-8">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={getFullImageUrl(stay.host.image)} alt={stay.host.name} />
                      <AvatarFallback>{stay.host.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">Hosted by {stay.host.name}</h3>
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span className="font-medium">{stay.host.rating}</span>
                        <span className="text-muted-foreground ml-1">
                          ({stay.host.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6">
                    I'm passionate about sharing my home with travelers from around the world.
                    I've been hosting for several years and love helping guests discover the best of what our area has to offer.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChatButton
                      hostId={stay.host.id || ''}
                      listingId={id || ''}
                      listingType="stay"
                      listingTitle={stay.title}
                      className="w-full"
                    >
                      Message Host
                    </ChatButton>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="tel:">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Host
                      </a>
                    </Button>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <ReviewsSection 
                  listingId={id || ''} 
                  listingType="stay"
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
                      <span className="font-medium">{stay.details.location}</span>
                    </p>
                    <p className="text-muted-foreground ml-7">
                      Exact address will be provided after booking
                    </p>
                  </div>
                  
                  {/* Google Maps Component */}
                  <div className="rounded-lg overflow-hidden mb-6 h-[300px]">
                    {!isLoaded ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <GoogleMap
                        zoom={14}
                        center={locationCoords}
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
                          position={locationCoords}
                          icon={{
                            url: '/images/stay-marker.svg',
                            scaledSize: new google.maps.Size(40, 40)
                          }}
                        />
                      </GoogleMap>
                    )}
                  </div>
                  
                  <div className="flex justify-center mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${locationCoords.lat},${locationCoords.lng}`, '_blank')}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Nearby attractions:</h3>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>Central Park - 0.5 miles</li>
                      <li>Downtown Shopping Center - 1.2 miles</li>
                      <li>City Museum - 1.5 miles</li>
                    </ul>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Booking Card */}
          <div>
            {/* Main booking card - sticky */}
            <div className="sticky top-24 mb-6">
              <BookingWidget 
                stayId={id || ''}
                price={stay.price_per_night}
                maxGuests={stay.details.maxGuests}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StayDetails; 