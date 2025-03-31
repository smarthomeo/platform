import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Home, 
  Utensils, 
  Trash2, 
  Plus, 
  UploadCloud, 
  X,
  Loader2,
  MapPin
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MapLocationPicker } from "@/components/form/MapLocationPicker";

import { 
  createFoodExperience, 
  updateFoodExperience, 
  uploadFoodExperienceImage, 
  deleteFoodExperienceImage,
  setFoodExperiencePrimaryImage
} from "@/services/hostService";
import { getFoodExperienceById } from "@/services/foodExperienceService";

// Define location interface to match MapLocationPicker
interface Location {
  address: string;
  zipcode: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  displayLocation?: string;
}

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  cuisine_type: z.string().min(1, "Please select a cuisine type"),
  price_per_person: z.coerce.number().min(1, "Price must be at least 1"),
  menu_description: z.string().min(20, "Menu description must be at least 20 characters"),
  location_name: z.string().min(5, "Location name must be at least 5 characters"),
  duration: z.string().min(1, "Please select a duration"),
  max_guests: z.coerce.number().min(1, "Maximum guests must be at least 1"),
  language: z.string().min(1, "Please select a language")
});

type FormValues = z.infer<typeof formSchema>;

const HostFood = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Array<{ id: string; url: string; is_primary: boolean }>>([]);
  const [tempImages, setTempImages] = useState<Array<{ id: string; file: File; preview: string; is_primary: boolean }>>([]);
  const [uploading, setUploading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  // Add state for location
  const [location, setLocation] = useState<Location>({
    address: "",
    zipcode: "",
    city: "",
    state: "",
    latitude: 0,
    longitude: 0
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      cuisine_type: "",
      price_per_person: 0,
      menu_description: "",
      location_name: "",
      duration: "2 hours",
      max_guests: 8,
      language: "English"
    }
  });

  useEffect(() => {
    const fetchExperience = async () => {
      if (!id) {
        setIsEdit(false);
        return;
      }

      try {
        setLoading(true);
        setIsEdit(true);
        
        if (id === "new") {
          setIsEdit(false);
          setLoading(false);
          return;
        }
        
        // Fetch the food experience data from the backend
        const experienceData = await getFoodExperienceById(id);
        
        if (experienceData) {
          // Set up form with real data
          form.reset({
            title: experienceData.title,
            description: experienceData.description,
            cuisine_type: experienceData.cuisine_type,
            price_per_person: experienceData.price_per_person,
            menu_description: experienceData.menu_description || '',
            location_name: experienceData.location_name,
            duration: experienceData.details.duration,
            max_guests: parseInt(experienceData.details.groupSize.replace(/\D/g, '') || '8'),
            language: experienceData.details.language
          });

          // Set location data if coordinates exist
          if (experienceData.coordinates) {
            const locationParts = experienceData.details.location.split(',');
            const city = locationParts[0]?.trim() || '';
            const state = locationParts[1]?.trim() || '';
            
            setLocation({
              address: experienceData.details.location,
              zipcode: '', // This might not be available in the existing data
              city: city,
              state: state,
              latitude: experienceData.coordinates.lat,
              longitude: experienceData.coordinates.lng,
              displayLocation: experienceData.details.location
            });
          }
          
          // Set images from real data
          const imageData = experienceData.images.map(img => ({
            id: `img-${Date.now().toString()}-${Math.random().toString(36).substr(2, 9)}`,
            url: img.url,
            is_primary: Boolean(img.is_primary)
          }));
          setImages(imageData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching experience:", error);
        toast.error("Failed to load experience data");
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id, form]);

  useEffect(() => {
    // Cleanup temp image previews on component unmount
    return () => {
      tempImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [tempImages]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Validate location is selected
      if (location.latitude === 0 && location.longitude === 0) {
        toast.error("Please select a location on the map");
        setLoading(false);
        return;
      }
      
      if (isEdit && id && id !== "new") {
        await updateFoodExperience(id, {
          ...data,
          details: {
            duration: data.duration,
            groupSize: `Max ${data.max_guests} guests`,
            includes: ["Food", "Beverages"],
            language: data.language,
            location: `${location.city}, ${location.state}`
          },
          coordinates: {
            lat: location.latitude,
            lng: location.longitude
          },
          zipcode: location.zipcode
        });
        toast.success("Food experience updated successfully");
      } else {
        // Create the new experience
        const newExperience = await createFoodExperience({
          ...data,
          details: {
            duration: data.duration,
            groupSize: `Max ${data.max_guests} guests`,
            includes: ["Food", "Beverages"],
            language: data.language,
            location: `${location.city}, ${location.state}`
          },
          coordinates: {
            lat: location.latitude,
            lng: location.longitude
          },
          zipcode: location.zipcode
        });
        
        // Refresh user data to update host status in the UI
        await refreshUser();
        
        // Get the experience ID
        const experienceWithId = newExperience as { id: string | number };
        
        // If we have temp images, upload them to the newly created experience
        if (tempImages.length > 0 && experienceWithId && experienceWithId.id) {
          setUploading(true);
          
          try {
            // Upload each temporary image
            for (let i = 0; i < tempImages.length; i++) {
              const tempImage = tempImages[i];
              await uploadFoodExperienceImage(
                experienceWithId.id.toString(), 
                tempImage.file, 
                tempImage.is_primary, 
                i
              );
            }
            
            toast.success("Images uploaded successfully");
          } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Some images could not be uploaded");
          } finally {
            setUploading(false);
          }
        }
        
        toast.success("Food experience created successfully");
        
        // Navigate to the edit page for the new experience
        if (experienceWithId && experienceWithId.id) {
          navigate(`/host/food/edit/${experienceWithId.id}`);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error saving experience:", error);
      toast.error("Failed to save experience");
      setLoading(false);
    }
  };

  // Add a function to fetch the latest images
  const fetchLatestImages = async () => {
    if (!id || id === "new") return;
    
    try {
      const experienceData = await getFoodExperienceById(id);
      if (experienceData && experienceData.images) {
        const imageData = experienceData.images.map((img: any) => ({
          id: img.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: img.url,
          is_primary: Boolean(img.is_primary)
        }));
        setImages(imageData);
      }
    } catch (error) {
      console.error("Error fetching latest images:", error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // If we're in edit mode and have an ID, upload to the server directly
    if (isEdit && id && id !== "new") {
      try {
        setUploading(true);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isPrimary = images.length === 0;
          
          await uploadFoodExperienceImage(id, file, isPrimary);
        }
        
        // Fetch the latest images from the server
        await fetchLatestImages();
        
        toast.success("Images uploaded successfully");
        setUploading(false);
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images");
        setUploading(false);
      }
    } else {
      // If we're creating a new experience, store the images temporarily
      try {
        const newTempImages = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const preview = URL.createObjectURL(file);
          const isPrimary = tempImages.length === 0 && i === 0;
          
          newTempImages.push({
            id: `temp-${Date.now()}-${i}`,
            file,
            preview,
            is_primary: isPrimary
          });
        }
        
        setTempImages(prev => [...prev, ...newTempImages]);
        toast.success("Images added successfully");
      } catch (error) {
        console.error("Error adding images:", error);
        toast.error("Failed to add images");
      }
    }
    
    // Clear the input
    event.target.value = '';
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!imageId) return;
    
    // Check if it's a temporary image or an uploaded one
    if (imageId.startsWith('temp-')) {
      // Remove from temp images
      setTempImages(prev => {
        const filtered = prev.filter(img => img.id !== imageId);
        
        // If we removed the primary image and have other images, make the first one primary
        if (prev.find(img => img.id === imageId)?.is_primary && filtered.length > 0) {
          filtered[0].is_primary = true;
        }
        
        return filtered;
      });
      toast.success("Image removed");
    } else {
      // Delete from server
      try {
        await deleteFoodExperienceImage(imageId);
        
        // Fetch the latest images from the server
        await fetchLatestImages();
        
        toast.success("Image deleted successfully");
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("Failed to delete image");
      }
    }
  };

  const setAsPrimaryImage = async (imageId: string) => {
    // For temporary images
    if (imageId.startsWith('temp-')) {
      setTempImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
    } else if (isEdit && id && id !== "new") {
      // For server images 
      try {
        await setFoodExperiencePrimaryImage(id, imageId);
        
        // Fetch the latest images from the server
        await fetchLatestImages();
        
        toast.success("Primary image updated");
      } catch (error) {
        console.error("Error setting primary image:", error);
        toast.error("Failed to update primary image");
      }
    }
  };

  const cuisineTypes = [
    "Italian", "French", "Japanese", "Chinese", "Mexican", 
    "Indian", "Thai", "American", "Mediterranean", "Middle Eastern",
    "Spanish", "Greek", "Vietnamese", "Korean", "Brazilian",
    "Ethiopian", "Lebanese", "Moroccan", "Turkish", "Other"
  ];

  const durations = [
    "1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", 
    "3.5 hours", "4 hours", "4.5 hours", "5 hours", "More than 5 hours"
  ];

  const languages = [
    "English", "Spanish", "French", "German", "Italian", 
    "Portuguese", "Japanese", "Chinese", "Korean", "Arabic",
    "Russian", "Hindi", "Other"
  ];

  const getImageUrl = (imagePath: string) => {
    // If it's already a URL (for example, a preview URL for temp images)
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
      return imagePath;
    }
    
    // If it's a path in Supabase storage
    if (imagePath.startsWith('food-experience-images/')) {
      const { data } = supabase.storage
        .from('food-experience-images')
        .getPublicUrl(imagePath.replace('food-experience-images/', ''));
      
      return data.publicUrl;
    }
    
    // Fallback
    return imagePath;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-terracotta-50 p-6">
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/host/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Edit Food Experience" : "Create Food Experience"}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Food Experience Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Authentic Italian Pasta Making" {...field} />
                        </FormControl>
                        <FormDescription>
                          Create a catchy title for your experience
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cuisine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuisine Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a cuisine type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cuisineTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The primary cuisine style of your experience
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your food experience in detail..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of what guests can expect
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_per_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Person</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                              $
                            </span>
                            <Input
                              type="number"
                              className="pl-8"
                              placeholder="25"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          How much will you charge per guest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_guests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Guests</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="8" {...field} />
                        </FormControl>
                        <FormDescription>
                          The maximum number of guests you can accommodate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {durations.map((duration) => (
                              <SelectItem key={duration} value={duration}>
                                {duration}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long will your experience last
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Primary language for the experience
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="menu_description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Menu Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the menu or food items in detail..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the dishes or food items that will be prepared or served
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. My Home Kitchen, Downtown Restaurant" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of the location where the experience will take place
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Location Details</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="mb-4 flex items-center text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Select your location directly from the map</span>
                      </div>
                      <MapLocationPicker 
                        value={location}
                        onChange={setLocation}
                        error={loading ? "" : !location.latitude && !location.longitude ? "Please select a location" : ""}
                      />
                      
                      {/* Display selected location details */}
                      {location.latitude !== 0 && location.longitude !== 0 && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium text-sm mb-2">Selected Location:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Address:</span> {location.address || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Zipcode:</span> {location.zipcode || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">City:</span> {location.city || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">State:</span> {location.state || "N/A"}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Coordinates:</span> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Images</h3>
                  
                  {/* Display images - both temporary and server-stored */}
                  {(isEdit || tempImages.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {/* Show temp images when creating a new experience */}
                      {!isEdit && tempImages.map((image) => (
                        <div key={image.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3]">
                          <img 
                            src={image.preview} 
                            alt="Food experience preview" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ objectPosition: 'center' }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                            <button 
                              onClick={() => handleDeleteImage(image.id)}
                              type="button"
                              className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-2">
                            {!image.is_primary && (
                              <button
                                onClick={() => setAsPrimaryImage(image.id)}
                                type="button"
                                className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded"
                              >
                                Set as Primary
                              </button>
                            )}
                          </div>
                          {image.is_primary && (
                            <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {/* Show uploaded images when editing an existing experience */}
                      {isEdit && images.map((image) => (
                        <div key={image.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-[4/3]">
                          <img 
                            src={getImageUrl(image.url)} 
                            alt="Food experience" 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ objectPosition: 'center' }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                            <button 
                              onClick={() => handleDeleteImage(image.id)}
                              type="button"
                              className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-2">
                            {!image.is_primary && (
                              <button
                                onClick={() => setAsPrimaryImage(image.id)}
                                type="button"
                                className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded"
                              >
                                Set as Primary
                              </button>
                            )}
                          </div>
                          {image.is_primary && (
                            <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-center">
                    <div className="relative w-full max-w-md">
                      <div className="flex items-center justify-center w-full">
                        <label 
                          htmlFor="image-upload" 
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                              <>
                                <Loader2 className="w-8 h-8 text-gray-500 mb-1 animate-spin" />
                                <p className="text-sm text-gray-500">Uploading images...</p>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-8 h-8 text-gray-500 mb-1" />
                                <p className="text-sm text-gray-500">
                                  Click to upload images or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </>
                            )}
                          </div>
                          <input 
                            id="image-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            multiple
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Guidance message for new experience creation */}
                  {tempImages.length > 0 && !isEdit && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      These images will be uploaded when you create the experience
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/host/dashboard")}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || uploading}>
                    {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? "Update Experience" : "Create Experience"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostFood;