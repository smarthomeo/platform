import { useEffect, useState } from "react";
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

interface FeaturedItem {
  id: number;
  title: string;
  description: string;
  image: string;
  price_per_person?: number;
  price_per_night?: number;
  host: {
    name: string;
    rating: number;
    reviews: number;
  };
}

interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
  count: number;
}

// Interface for API response
interface CategoryCount {
  cuisine_type: string;
  count: number;
}

const ItemCard = ({ 
  item, 
  onClick, 
  priceLabel, 
  showRating,
  showCount 
}: { 
  item: FeaturedItem | Category; 
  onClick: () => void; 
  priceLabel?: string; 
  showRating?: boolean;
  showCount?: boolean;
}) => (
  <div 
    className="group cursor-pointer transition-all duration-300"
    onClick={onClick}
  >
    <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5 bg-white">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>
        {(priceLabel || showRating || showCount) && (
          <div className="flex justify-between items-center">
            {priceLabel && (
              <span className="font-medium text-primary">{priceLabel}</span>
            )}
            {showRating && 'host' in item && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{item.host.rating}</span>
                <span className="text-sm text-gray-500">
                  ({item.host.reviews})
                </span>
              </div>
            )}
            {showCount && 'count' in item && (
              <span className="text-sm font-medium text-primary-foreground bg-primary px-2 py-1 rounded-full">
                {item.count} foods
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Section = <T extends { id: number | string }>({ 
  title, 
  items, 
  viewAllLink, 
  renderItem 
}: { 
  title: string; 
  items: T[]; 
  viewAllLink?: string; 
  renderItem: (item: T) => React.ReactNode; 
}) => {
  const navigate = useNavigate();
  
  if (items.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display">
            {title}
          </h2>
          {viewAllLink && (
            <Button 
              variant="outline" 
              onClick={() => navigate(viewAllLink)}
              className="text-base hover:bg-gray-100"
            >
              View All
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.slice(0, 3).map((item) => renderItem(item))}
        </div>
      </div>
    </section>
  );
};

export const FeaturedSection = () => {
  const navigate = useNavigate();
  const [featuredFood, setFeaturedFood] = useState<FeaturedItem[]>([]);
  const [featuredStays, setFeaturedStays] = useState<FeaturedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionLoadingStates, setSectionLoadingStates] = useState({
    food: true,
    categories: true,
    stays: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from API service with caching
        const fetchFood = async () => {
          try {
            setSectionLoadingStates(prev => ({ ...prev, food: true }));
            const foodData = await apiService.getFeaturedFood();
            setFeaturedFood(foodData);
          } catch (err) {
            console.error('Error fetching food:', err);
          } finally {
            setSectionLoadingStates(prev => ({ ...prev, food: false }));
          }
        };

        const fetchStays = async () => {
          try {
            setSectionLoadingStates(prev => ({ ...prev, stays: true }));
            const staysData = await apiService.getFeaturedStays();
            setFeaturedStays(staysData);
          } catch (err) {
            console.error('Error fetching stays:', err);
          } finally {
            setSectionLoadingStates(prev => ({ ...prev, stays: false }));
          }
        };

        const fetchCategories = async () => {
          try {
            setSectionLoadingStates(prev => ({ ...prev, categories: true }));
            const categoriesData = await apiService.getFoodCategories();
            
            if (Array.isArray(categoriesData) && categoriesData.length > 0) {
              const categoryImages = {
                'Italian': '/images/italian.jpg',
                'Asian': '/images/asian.jpg', 
                'African': '/images/african.jpg',
                'Mexican': '/images/mexican.jpg',
                'American': '/images/american.jpg',
                'Mediterranean': '/images/mediterranean.jpg',
                'European': '/images/european.jpg',
                'Indian': '/images/indian.jpg',
                'Middle Eastern': '/images/middle-eastern.jpg',
                'Japanese': '/images/japanese.jpg',
                'Thai': '/images/thai.jpg',
                'Chinese': '/images/chinese.jpg',
                'Korean': '/images/korean.jpg',
                'Vietnamese': '/images/vietnamese.jpg',
                'French': '/images/french.jpg',
                'Spanish': '/images/spanish.jpg',
                'Greek': '/images/greek.jpg',
                'Caribbean': '/images/caribbean.jpg',
                'Latin American': '/images/latin-american.jpg',
                'Vegetarian': '/images/vegetarian.jpg',
                'Vegan': '/images/vegan.jpg',
                'Gluten-Free': '/images/gluten-free.jpg',
                'default': '/images/default-cuisine.jpg'
              };
              
              const formattedCategories = categoriesData.map(item => {
                const categoryId = item.cuisine_type;
                const imageKey = categoryId in categoryImages ? categoryId : 'default';
                
                return {
                  id: categoryId,
                  title: `${categoryId} Cuisine`,
                  description: `Explore delicious ${categoryId} dishes and cooking experiences`,
                  image: categoryImages[imageKey as keyof typeof categoryImages],
                  count: item.count
                };
              });
              
              setCategories(formattedCategories);
            }
          } catch (err) {
            console.error('Error fetching categories:', err);
          } finally {
            setSectionLoadingStates(prev => ({ ...prev, categories: false }));
          }
        };

        // Fetch all data in parallel
        await Promise.all([
          fetchFood(),
          fetchStays(),
          fetchCategories()
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured data:', error);
        setError('Failed to load featured content');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if all sections are done loading
  useEffect(() => {
    if (!sectionLoadingStates.food && 
        !sectionLoadingStates.stays && 
        !sectionLoadingStates.categories) {
      setLoading(false);
    }
  }, [sectionLoadingStates]);
  
  const LoadingPlaceholder = () => (
    <div className="py-6 px-4 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center h-[250px]">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (loading && !featuredFood.length && !featuredStays.length && !categories.length) {
    return (
      <div className="space-y-16 container mx-auto px-4 py-12">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display mb-8">
            Popular Food Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <LoadingPlaceholder key={i} />)}
          </div>
        </div>
        
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display mb-8">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <LoadingPlaceholder key={i} />)}
          </div>
        </div>
        
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display mb-8">
            Featured Stays
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <LoadingPlaceholder key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error && !featuredFood.length && !featuredStays.length && !categories.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <Section
        title="Popular Food Experiences"
        items={featuredFood}
        viewAllLink="/food"
        renderItem={(item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => navigate(`/food/${item.id}`)}
            priceLabel={`$${item.price_per_person} per person`}
            showRating
          />
        )}
      />
      
      {sectionLoadingStates.categories && !categories.length ? (
        <div className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display mb-8">
              Browse by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <LoadingPlaceholder key={i} />)}
            </div>
          </div>
        </div>
      ) : (
        <Section
          title="Browse by Category"
          items={categories}
          renderItem={(category) => (
            <ItemCard
              key={category.id}
              item={category}
              onClick={() => navigate(`/food?cuisine_types=${encodeURIComponent(category.id)}`)}
              showCount
            />
          )}
        />
      )}

      <Section
        title="Featured Stays"
        items={featuredStays}
        viewAllLink="/stays"
        renderItem={(item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => navigate(`/stays/${item.id}`)}
            priceLabel={`$${item.price_per_night} per night`}
            showRating
          />
        )}
      />
    </div>
  );
};

export default FeaturedSection;