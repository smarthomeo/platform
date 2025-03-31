import { useEffect, useState, useRef } from "react";
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

const ScrollingCategories = ({ categories }: { categories: Category[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!scrollRef.current || categories.length === 0 || isDragging) return;

    const scrollContainer = scrollRef.current;
    const scrollWidth = scrollContainer.scrollWidth;
    const containerWidth = scrollContainer.clientWidth;
    const scrollDistance = scrollWidth - containerWidth;
    
    const scroll = () => {
      if (isHovered || isDragging) return;
      
      const currentScroll = scrollContainer.scrollLeft;
      if (currentScroll >= scrollDistance) {
        // Reset to start when reaching the end
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft += 1;
      }
    };

    const intervalId = setInterval(scroll, 30);

    return () => clearInterval(intervalId);
  }, [categories, isHovered, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current!.offsetLeft);
    setScrollLeft(scrollRef.current!.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current!.offsetLeft);
    setScrollLeft(scrollRef.current!.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - scrollRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current!.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="py-12 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 font-display mb-8">
          Popular Categories
        </h2>
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsDragging(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Duplicate categories for seamless scrolling */}
          {[...categories, ...categories].map((category, index) => (
            <div
              key={`${category.id}-${index}`}
              className="flex-shrink-0 w-[300px]"
              onMouseDown={(e) => e.preventDefault()}
            >
              <ItemCard
                item={category}
                onClick={() => !isDragging && navigate(`/food?cuisine_types=${encodeURIComponent(category.id)}`)}
                showCount
              />
            </div>
          ))}
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
                'Italian': '/images/italian.jpeg',
                'Asian': '/images/asian.jpeg', 
                'African': '/images/african.jpeg',
                'Mexican': '/images/mexican.jpeg',
                'American': '/images/american.jpeg',
                'Mediterranean': '/images/mediterranean.jpeg',
                'European': '/images/european.jpeg',
                'Indian': '/images/indian.jpeg',
                'Middle Eastern': '/images/middle-eastern.jpeg',
                'Japanese': '/images/japanese.jpeg',
                'Thai': '/images/thai.jpeg',
                'Chinese': '/images/chinese.jpeg',
                'Korean': '/images/korean.jpeg',
                'Vietnamese': '/images/vietnamese.jpeg',
                'French': '/images/french.jpeg',
                'Spanish': '/images/spanish.jpeg',
                'Greek': '/images/greek.jpeg',
                'Caribbean': '/images/caribbean.jpeg',
                'Latin American': '/images/latin-american.jpeg',
                'Vegetarian': '/images/vegetarian.jpeg',
                'Vegan': '/images/vegan.jpeg',
                'Gluten-Free': '/images/gluten-free.jpeg',
                'default': '/images/default-cuisine.jpeg'
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
    <div className="space-y-8">
      {/* Featured Food Section */}
      {!sectionLoadingStates.food ? (
        <Section
          title="Featured Food Experiences"
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
      ) : (
        <LoadingPlaceholder />
      )}

      {/* Scrolling Categories Section */}
      {!sectionLoadingStates.categories && categories.length > 0 && (
        <ScrollingCategories categories={categories} />
      )}

      {/* Featured Stays Section */}
      {!sectionLoadingStates.stays ? (
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
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
};

export default FeaturedSection;