import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Bed, Bath, Users, Map, List, MapPin, Calendar, Home, Star, Heart, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import { SortSelect } from '@/components/filters/SortSelect';
import { GoogleMap, MarkerF, useLoadScript, Libraries } from '@react-google-maps/api';
import { LoadingSpinner } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { stayService, type Stay } from "@/services/stayService";
import { useAuth } from "@/contexts/AuthContext";
import { StayCard } from "@/components/cards/StayCard";

// Property types with more relevant categories for individual hosts
const propertyTypes = [
  { id: 'room', label: 'Private Room', description: 'A private room in a home' },
  { id: 'apartment', label: 'Apartment', description: 'An entire apartment' },
  { id: 'house', label: 'House', description: 'An entire house' },
  { id: 'cabin', label: 'Cabin', description: 'A cozy cabin retreat' },
  { id: 'cottage', label: 'Cottage', description: 'A charming cottage' },
  { id: 'guesthouse', label: 'Guesthouse', description: 'A separate guesthouse' },
];

// Define libraries as a static constant to prevent re-creation on each render
const mapLibraries: Libraries = ['places'];

// Create a centralized Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDpB03uqoC8eWmdG8KRlBdiJaHWbXmtMgE';

// Bedroom options
const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4+", label: "4+ Bedrooms" },
];

// Guest options
const guestOptions = [
  { value: "any", label: "Any" },
  { value: "1-2", label: "1-2 Guests" },
  { value: "3-4", label: "3-4 Guests" },
  { value: "5+", label: "5+ Guests" },
];

// Availability options
const availabilityOptions = [
  { value: "any", label: "Any time" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "flexible", label: "I'm flexible" },
];

const Stays = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [applyDateFilter, setApplyDateFilter] = useState(false);
  const [sortBy, setSortBy] = useState("price_asc");
  const [showMap, setShowMap] = useState(false);
  const [zipcode, setZipcode] = useState<string | null>(searchParams.get('zipcode'));
  const [location, setLocation] = useState<string | null>(searchParams.get('location'));
  const [bedrooms, setBedrooms] = useState("any");
  const [guests, setGuests] = useState("any");
  const [availability, setAvailability] = useState("any");
  const [applyButtonAnimation, setApplyButtonAnimation] = useState(false);
  const [resetButtonAnimation, setResetButtonAnimation] = useState(false);
  const { user } = useAuth();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: mapLibraries,
    // Add a unique ID to ensure only one instance loads
    id: 'google-map-script'
  });

  useEffect(() => {
    // Update zipcode and location when searchParams change
    setZipcode(searchParams.get('zipcode'));
    setLocation(searchParams.get('location'));
  }, [searchParams]);

  

  useEffect(() => {
    const fetchStays = async () => {
      try {
        setLoading(true);
        
        // Fetch stays from the service with the appropriate filters
        const staysData = await stayService.getStays({
          search: searchQuery,
          zipcode: zipcode || undefined,
          location: location || undefined,
          sort: sortBy,
          propertyType: selectedTypes.length > 0 ? selectedTypes : undefined
        });
        
        console.log('Fetched stays count:', staysData.length);
        setStays(staysData);
      } catch (error) {
        console.error('Error fetching stays:', error);
        setStays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStays();
  }, [searchParams, sortBy, zipcode, location, searchQuery, selectedTypes]);

  // Apply client-side filtering for things that the backend doesn't handle yet
  const filteredStays = useMemo(() => {
    return stays.filter(stay => {
      // Apply bedroom filter - only if a specific option is selected
      if (bedrooms !== "any") {
        if (bedrooms === "4+" && stay.details.bedrooms < 4) {
          return false;
        } else if (bedrooms !== "4+" && stay.details.bedrooms !== parseInt(bedrooms)) {
          return false;
        }
      }

      // Apply guest filter - only if a specific option is selected
      if (guests !== "any") {
        if (guests === "5+" && stay.details.maxGuests < 5) {
          return false;
        } else if (guests === "3-4" && (stay.details.maxGuests < 3 || stay.details.maxGuests > 4)) {
          return false;
        } else if (guests === "1-2" && (stay.details.maxGuests < 1 || stay.details.maxGuests > 2)) {
          return false;
        }
      }

      // Apply availability filter based on selected option
      if (availability !== "any" && stay.availability) {
        const today = new Date();
        const weekend = new Date(today);
        weekend.setDate(today.getDate() + (6 - today.getDay()));
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        let availabilityEndDate;
        
        switch(availability) {
          case "weekend":
            availabilityEndDate = weekend;
            break;
          case "week":
            availabilityEndDate = nextWeek;
            break;
          case "month":
            availabilityEndDate = nextMonth;
            break;
          case "flexible":
            // For flexible, we'll check if there are at least 5 available days in the next month
            let availableDaysCount = 0;
            const checkDate = new Date(today);
            while (checkDate <= nextMonth) {
              const formattedDate = format(checkDate, 'yyyy-MM-dd');
              if (stay.availability?.find(a => a.date === formattedDate && a.is_available)) {
                availableDaysCount++;
                if (availableDaysCount >= 5) break;
              }
              checkDate.setDate(checkDate.getDate() + 1);
            }
            if (availableDaysCount < 5) return false;
            break;
        }
        
        // If specific date range is selected (not flexible)
        if (availability !== "flexible" && availabilityEndDate) {
          let hasAvailability = false;
          const checkDate = new Date(today);
          
          while (checkDate <= availabilityEndDate) {
            const formattedDate = format(checkDate, 'yyyy-MM-dd');
            if (stay.availability?.find(a => a.date === formattedDate && a.is_available)) {
              hasAvailability = true;
              break;
            }
            checkDate.setDate(checkDate.getDate() + 1);
          }
          
          if (!hasAvailability) return false;
        }
      }

      // Apply date range filter ONLY if applyDateFilter is true
      if (applyDateFilter && dateRange.from && dateRange.to && stay.availability) {
        // Check if all dates in the range are available
        let allDatesAvailable = true;
        const currentDate = new Date(dateRange.from);
        
        while (currentDate <= dateRange.to) {
          const formattedDate = format(currentDate, 'yyyy-MM-dd');
          const availableDay = stay.availability?.find(a => a.date === formattedDate);
          
          if (!availableDay || !availableDay.is_available) {
            allDatesAvailable = false;
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (!allDatesAvailable) {
          return false;
        }
      }

      return true;
    });
  }, [stays, bedrooms, guests, availability, applyDateFilter, dateRange]);

  // Debug: Log the filtered stays count - keep this but memoize the filtered stays
  useEffect(() => {
    console.log('Filtered stays count after client filtering:', filteredStays.length);
  }, [filteredStays.length]);

  
    
    
  const handleTypeChange = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setSearchQuery("");
    setBedrooms("any");
    setGuests("any");
    setAvailability("any");
    setApplyDateFilter(false);
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 7),
    });
    
    // Trigger reset button animation
    setResetButtonAnimation(true);
    setTimeout(() => setResetButtonAnimation(false), 500);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    console.log('Sort changed to:', value);
  };

  const applyFilters = () => {
    // Close mobile filters
    setShowMobileFilters(false);
    
    // Set date filter to be applied
    setApplyDateFilter(true);
    
    // Trigger apply button animation
    setApplyButtonAnimation(true);
    setTimeout(() => setApplyButtonAnimation(false), 500);
  };

  // Calculate map center based on filtered stays
  const mapCenter = useMemo(() => {
    // Filter stays that have coordinates
    const staysWithCoordinates = filteredStays.filter(stay => stay.coordinates);
    
    if (staysWithCoordinates.length === 0) {
      return { lat: 33.749, lng: -84.388 }; // Default to Atlanta if no stays have coordinates
    }
    
    // Calculate average lat/lng
    const totalLat = staysWithCoordinates.reduce((sum, stay) => sum + stay.coordinates!.lat, 0);
    const totalLng = staysWithCoordinates.reduce((sum, stay) => sum + stay.coordinates!.lng, 0);
    
    return {
      lat: totalLat / staysWithCoordinates.length,
      lng: totalLng / staysWithCoordinates.length
    };
  }, [filteredStays]);

  // Calculate map bounds and zoom level
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [mapZoom, setMapZoom] = useState(12);

  // Calculate map bounds and zoom to show all markers
  useEffect(() => {
    if (isLoaded && filteredStays.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let markersCount = 0;
      
      filteredStays.forEach(stay => {
        if (stay.coordinates) {
          bounds.extend(new google.maps.LatLng(
            stay.coordinates.lat,
            stay.coordinates.lng
          ));
          markersCount++;
        }
      });
      
      // Only update bounds if we have at least one marker
      if (markersCount > 0) {
        setMapBounds(bounds);
        
        // Set zoom based on number of markers
        if (markersCount === 1) {
          setMapZoom(14); // Closer zoom for single marker
        } else if (markersCount < 5) {
          setMapZoom(12); // Medium zoom for few markers
        } else {
          setMapZoom(10); // Further zoom for many markers
        }
      }
    }
  }, [filteredStays, isLoaded]);

  // Function to fit map to bounds when map loads
  const onMapLoad = (map: google.maps.Map) => {
    if (mapBounds) {
      map.fitBounds(mapBounds);
      
      // Adjust zoom if too far or too close
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) map.setZoom(16);
        if (map.getZoom() < 7) map.setZoom(7);
        google.maps.event.removeListener(listener);
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Stays</h1>
            {location && (
              <p className="text-muted-foreground mt-1">
                Showing stays in {location} {zipcode && `(${zipcode})`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <SortSelect value={sortBy} onValueChange={handleSort} />
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2"
            >
              {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              {showMap ? 'Show List' : 'Show Map'}
            </Button>
          </div>
        </div>

        {zipcode && (
          <div className="mb-4 flex items-center">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <MapPin className="h-3 w-3" />
              Zipcode: {zipcode}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1 rounded-full"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('zipcode');
                  newParams.delete('location');
                  navigate(`/stays?${newParams.toString()}`);
                }}
              >
                ×
              </Button>
            </Badge>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Filters */}
          <div className={`${showMobileFilters ? 'block fixed inset-0 z-50 bg-white p-6 overflow-auto' : 'hidden'} md:block md:static md:z-auto md:p-0 md:overflow-visible`}>
            {showMobileFilters && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)}>
                  ×
                </Button>
              </div>
            )}
            
            <div className="space-y-6 bg-white p-6 rounded-lg border">
              <div>
                <h3 className="text-lg font-medium mb-4">Stay Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {propertyTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedTypes.includes(type.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => handleTypeChange(type.id)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <Home className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Dates</h3>
                <div className="overflow-hidden">
                  <DatePickerWithRange
                    className="w-full"
                    date={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onDateChange={(range: any) => {
                      setDateRange(range);
                      // Reset the apply date filter when dates change
                      setApplyDateFilter(false);
                    }}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {applyDateFilter ? 
                    <span className="flex items-center text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Date filter applied</span> : 
                    <span>Click "Apply Filters" to filter by date</span>
                  }
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Availability</h3>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Rooms & Guests</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger id="bedrooms" className="w-full">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {bedroomOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guests">Guests</Label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger id="guests" className="w-full">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        {guestOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button 
                  onClick={applyFilters}
                  className={cn(
                    "transition-all",
                    applyButtonAnimation && "animate-pulse bg-green-600 scale-105"
                  )}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className={cn(
                    "transition-all",
                    resetButtonAnimation && "animate-pulse border-red-400 scale-105"
                  )}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {showMap && isLoaded ? (
            <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden border">
              <GoogleMap
                zoom={mapZoom}
                center={mapCenter}
                mapContainerClassName="w-full h-full"
                onLoad={onMapLoad}
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
                {filteredStays.map((stay) => (
                  stay.coordinates && (
                    <MarkerF
                      key={stay.id}
                      position={stay.coordinates}
                      onClick={() => navigate(`/stays/${stay.id}`)}
                      icon={{
                        url: '/images/stay-marker.svg',
                        scaledSize: new google.maps.Size(32, 32)
                      }}
                    />
                  )
                ))}
              </GoogleMap>
            </div>
          ) : (
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner className="h-8 w-8" />
                </div>
              ) : filteredStays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStays.map((stay) => (
                    <StayCard 
                      key={stay.id}
                      stay={stay}
                      propertyTypes={propertyTypes}
                      onClick={() => navigate(`/stays/${stay.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No stays found.</p>
                  <p className="text-sm text-gray-500 mb-6">
                    {stays.length > 0 
                      ? "Your filters are too restrictive. Try adjusting them." 
                      : "No stays data available. Please try again later."}
                  </p>
                  <Button 
                    onClick={handleReset}
                    className={cn(
                      "transition-all",
                      resetButtonAnimation && "animate-pulse border-red-400 scale-105"
                    )}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Stays;