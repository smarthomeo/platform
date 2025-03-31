export interface FoodExperienceFilter {
  cuisine_types?: string[];
  title?: string;
  zipcode?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
  limit?: number;
  offset?: number;
}

export interface StayFilter {
  max_price?: number;
  min_price?: number;
  beds?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  zipcode?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
} 