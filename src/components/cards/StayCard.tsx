import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bed, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface StayProps {
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
  };
  details: {
    bedrooms: number;
    beds: number;
    bathrooms: number;
    maxGuests: number;
    amenities: string[];
    location: string;
    propertyType?: string;
  };
}

interface StayCardProps {
  stay: StayProps;
  onClick?: () => void;
  propertyTypes?: { id: string; label: string; description: string }[];
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

export const StayCard = ({ stay, onClick, propertyTypes = [] }: StayCardProps) => {
  const navigate = useNavigate();
  
  // Add default values for missing data
  const {
    id,
    title = 'Untitled Stay',
    description = '',
    image,
    price_per_night = 0,
    host = {
      name: 'Unknown Host',
      image: '',
      rating: 0,
      reviews: 0
    },
    details = {
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: [],
      location: 'Location not specified',
      propertyType: 'room'
    }
  } = stay || {};

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/stays/${id}`);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <div 
          className="aspect-[4/3] overflow-hidden cursor-pointer"
          onClick={handleClick}
        >
          <img
            src={getFullImageUrl(image || '')}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        <Badge 
          className="absolute bottom-2 left-2 bg-white/90 text-black hover:bg-white/90"
        >
          {propertyTypes.find(t => t.id === details.propertyType)?.label || 'Stay'}
        </Badge>
      </div>
      <CardHeader className="cursor-pointer" onClick={handleClick}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">
              {host.rating.toFixed(1)} ({host.reviews})
            </span>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{details.bedrooms} {details.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{details.maxGuests} guests</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={getFullImageUrl(host.image)}
                alt={host.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm">{host.name}</span>
            </div>
            <span className="text-lg font-semibold text-primary">
              ${price_per_night}
              <span className="text-sm font-normal text-muted-foreground">/night</span>
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full"
          onClick={handleClick}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}; 