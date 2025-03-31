export interface FoodExperience {
  id: string | number;
  title: string;
  description: string;
  images: ImageData[];
  price_per_person: number;
  cuisine_type: string;
  menu_description: string;
  location_name: string;
  amenities?: string[];
  zipcode?: string;
  host: {
    id?: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    about?: string;
  };
  details: {
    duration: string;
    groupSize: string;
    includes: string[];
    language: string;
    location: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ImageData {
  url: string;
  order?: number;
  is_primary?: boolean;
  full_url?: string;
}

export interface FoodAvailability {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  available_spots: number;
}

export interface FoodBooking {
  id: string;
  experience_id: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
} 