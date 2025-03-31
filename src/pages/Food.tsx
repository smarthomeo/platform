import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import FilterSidebar from "@/components/filters/FilterSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChefHat } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from '@/components/ui/loading';
import { SortSelect } from '@/components/filters/SortSelect';
import { FoodCard } from "@/components/cards/FoodCard";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from "@/components/ui/badge";

// Import our service functions
import { getFoodExperiences, getFoodCategories } from "@/services/foodExperienceService";
import type { FoodExperience, ImageData } from "@/types/food";
import type { FilterOption } from "@/types/filters";

// Define default cuisine types
const defaultCuisineTypes = [
  { id: 'Italian', label: 'Italian', count: 0 },
  { id: 'Mexican', label: 'Mexican', count: 0 },
  { id: 'Japanese', label: 'Japanese', count: 0 },
  { id: 'Indian', label: 'Indian', count: 0 },
  { id: 'Thai', label: 'Thai', count: 0 },
  { id: 'Chinese', label: 'Chinese', count: 0 },
  { id: 'Mediterranean', label: 'Mediterranean', count: 0 },
  { id: 'French', label: 'French', count: 0 }
];

const cuisineTypes = defaultCuisineTypes;

const Food = () => {
  const [searchParams] = useSearchParams();
  const [experiences, setExperiences] = useState<FoodExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [cuisineCounts, setCuisineCounts] = useState<FilterOption[]>(defaultCuisineTypes);
  const navigate = useNavigate();

  const getFullImageUrl = (url: string) => {
    if (!url) return '/default-food.jpg';
    if (url.startsWith('http')) return url;
    // If image is stored in Supabase Storage
    if (url.startsWith('food-experience-images/')) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${url}`;
    }
    return url;
  };

  // Fetch cuisine counts from Supabase
  const fetchCuisineCounts = async () => {
    try {
      const data = await getFoodCategories();
      const formattedCounts = data.map(item => ({
        id: item.cuisine_type,
        label: item.cuisine_type,
        count: item.count
      }));
      setCuisineCounts(formattedCounts);
    } catch (error) {
      console.error('Error fetching cuisine counts:', error);
    }
  };

  useEffect(() => {
    fetchCuisineCounts();
    
    // Check for cuisine_types in URL params when component mounts
    const cuisineTypesParam = searchParams.get('cuisine_types');
    if (cuisineTypesParam) {
      const cuisines = cuisineTypesParam.split(',');
      setSelectedCuisines(cuisines);
    }
  }, []);

  useEffect(() => {
    const filters: Record<string, any> = {
      sort: sortBy
    };

    // Add zipcode from URL if present
    const zipcode = searchParams.get('zipcode');
    if (zipcode) {
      filters.zipcode = zipcode;
    }
    
    // Add cuisine types from URL if present
    const cuisineTypesParam = searchParams.get('cuisine_types');
    if (cuisineTypesParam) {
      filters.cuisine_types = cuisineTypesParam.split(',');
    }

    // Add title search if present
    if (searchTitle.trim()) {
      filters.title = searchTitle.trim();
    }
    
    // Add cuisine types if selected
    if (selectedCuisines.length > 0) {
      filters.cuisine_types = selectedCuisines;
    }

    fetchExperiences(filters);
  }, [searchParams, sortBy, searchTitle, selectedCuisines]);

  const fetchExperiences = async (filters = {}) => {
    try {
      setLoading(true);
      console.log('Fetching experiences with filters:', filters);
      
      const data = await getFoodExperiences(filters);
      
      // Process the images URLs
      const processedData = data.map((exp) => ({
        ...exp,
        images: exp.images.map(img => ({
          ...img,
          url: getFullImageUrl(img.url)
        }))
      }));
      
      setExperiences(processedData);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCuisineChange = (cuisineId: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisineId)) {
        return prev.filter(id => id !== cuisineId);
      } else {
        return [...prev, cuisineId];
      }
    });
  };

  const handleReset = () => {
    setSearchTitle("");
    setSelectedCuisines([]);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Food Experiences</h1>
          <p className="text-gray-600">Discover unique culinary adventures from local hosts</p>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Input
                  placeholder="Search food experiences by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="pl-10 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={toggleFilters} 
              className="h-12 px-4 rounded-lg md:hidden"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {selectedCuisines.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCuisines.map(cuisine => (
              <Badge 
                key={cuisine} 
                variant="secondary"
                className="px-3 py-1 rounded-full flex items-center gap-1"
              >
                <ChefHat className="h-3 w-3" />
                {cuisine}
                <button 
                  onClick={() => handleCuisineChange(cuisine)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Section - Hidden on mobile unless toggled */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 space-y-4`}>
            <div className="flex justify-between items-center md:hidden mb-4">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={toggleFilters}>
                Close
              </Button>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Filter Food Experiences</h2>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Sort By</h3>
                <SortSelect
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                />
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {cuisineCounts.map(cuisine => (
                    <div key={cuisine.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`cuisine-${cuisine.id}`}
                          checked={selectedCuisines.includes(cuisine.id)}
                          onChange={() => handleCuisineChange(cuisine.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`cuisine-${cuisine.id}`} className="ml-2 text-sm text-gray-700">
                          {cuisine.label}
                        </label>
                      </div>
                      <span className="text-xs text-gray-500">({cuisine.count})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="w-full text-sm mt-4"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Listings Section */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : experiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiences.map((experience) => (
                  <ErrorBoundary key={experience.id}>
                    <FoodCard
                      experience={experience}
                      onClick={() => navigate(`/food/${experience.id}`)}
                    />
                  </ErrorBoundary>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg text-gray-600 mb-2">No food experiences found.</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Food;

