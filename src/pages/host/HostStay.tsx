import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { AmenitiesSelect } from "@/components/AmenitiesSelect";
import { MapLocationPicker } from '@/components/form/MapLocationPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStay, updateStay, uploadStayImage, deleteStayImage, setStayPrimaryImage } from "@/services/hostService";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location_name: z.string().min(1, "Location is required"),
  price_per_night: z.number().min(0, "Price must be positive"),
  max_guests: z.number().min(1, "Must have at least 1 guest"),
  bedrooms: z.number().min(1, "Must have at least 1 bedroom"),
  beds: z.number().min(1, "Must have at least 1 bed"),
  bathrooms: z.number().min(1, "Must have at least 1 bathroom"),
  images: z.array(z.string()),
  status: z.enum(["draft", "published"]),
  amenities: z.array(z.string()),
  availability: z.array(z.object({
    date: z.string(),
    is_available: z.boolean(),
    price_override: z.number().optional()
  })),
  address: z.string().min(1, "Address is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  latitude: z.number(),
  longitude: z.number(),
  property_type: z.string().min(1, "Property type is required"),
});

type FormData = z.infer<typeof formSchema>;

interface Amenity {
  id: string;
  name: string;
}

// Property types with more relevant categories for individual hosts
const propertyTypes = [
  { id: 'room', label: 'Private Room', description: 'A private room in a home' },
  { id: 'apartment', label: 'Apartment', description: 'An entire apartment' },
  { id: 'house', label: 'House', description: 'An entire house' },
  { id: 'cabin', label: 'Cabin', description: 'A cozy cabin retreat' },
  { id: 'cottage', label: 'Cottage', description: 'A charming cottage' },
  { id: 'guesthouse', label: 'Guesthouse', description: 'A separate guesthouse' },
];

const HostStay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAuthHeader, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [location, setLocation] = useState({
    address: '',
    zipcode: '',
    city: '',
    state: '',
    latitude: 0,
    longitude: 0,
    displayLocation: ''
  });
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location_name: "",
      price_per_night: 0,
      max_guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      images: [],
      status: "draft",
      amenities: [],
      availability: [],
      address: '',
      zipcode: '',
      city: '',
      state: '',
      latitude: 0,
      longitude: 0,
      property_type: 'house'
    }
  });

  const getFullImageUrl = (url: string) => {
    if (!url) return '/default-stay.jpg';
    if (url.startsWith('http')) return url;
    // For Supabase storage URLs
    if (url.startsWith('stay-images/')) {
      const { data } = supabase.storage
        .from('stay-images')
        .getPublicUrl(url.replace('stay-images/', ''));
      
      return data.publicUrl;
    }
    return `${import.meta.env.VITE_API_URL}/${url}`;
  };

  // Separate fetchStay function that can be called when needed
  const fetchStay = useCallback(async () => {
    if (!id || id === 'new') return;
    
    try {
      setLoading(true);

      const { data: stayData, error } = await supabase
        .from('stays')
        .select(`
          *,
          images:stay_images(id, image_path, is_primary, display_order)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      // Process the images URLs
      const processedImages = stayData.images.map((img: any) => 
        getFullImageUrl(img.image_path)
      );
      
      // Fetch any availability data
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('stay_availability')
        .select('*')
        .eq('stay_id', id);

      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
      }

      const availability = availabilityData || [];
      
      // Ensure amenities is an array
      const stayAmenities = Array.isArray(stayData.amenities) ? stayData.amenities : [];
      
      // If this stay has amenities, we need to fetch the full amenity details
      if (stayAmenities.length > 0) {
        // Query the amenities table for the selected amenities
        const { data: amenityData } = await supabase
          .from('amenities')
          .select('*')
          .in('id', stayAmenities);
          
        if (amenityData && amenityData.length > 0) {
          setSelectedAmenities(amenityData);
        }
      }
      
      // Prepare the location object
      const locationData = {
        address: stayData.address,
        zipcode: stayData.zipcode,
        city: stayData.city,
        state: stayData.state,
        latitude: parseFloat(stayData.latitude),
        longitude: parseFloat(stayData.longitude),
        displayLocation: stayData.location_name || stayData.location
      };
      
      // Update state in a single batch
      setImages(processedImages);
      setLocation(locationData);
      
      // Use form.reset instead of multiple setValue calls
      form.reset({
        title: stayData.title,
        description: stayData.description,
        location_name: stayData.location_name || stayData.location,
        price_per_night: parseFloat(stayData.price_per_night),
        max_guests: parseInt(stayData.max_guests),
        bedrooms: parseInt(stayData.bedrooms),
        beds: parseInt(stayData.beds) || parseInt(stayData.bedrooms),
        bathrooms: parseInt(stayData.bathrooms) || 1,
        images: processedImages,
        status: stayData.status,
        amenities: stayAmenities.map((a: any) => 
          typeof a === 'object' ? a.id.toString() : a.toString()
        ),
        availability: availability.map((item: any) => ({
          date: item.date,
          is_available: item.is_available,
          price_override: item.price
        })),
        address: stayData.address,
        zipcode: stayData.zipcode,
        city: stayData.city,
        state: stayData.state,
        latitude: parseFloat(stayData.latitude),
        longitude: parseFloat(stayData.longitude),
        property_type: stayData.property_type || 'house'
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stay",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id]); // Removed dependencies that cause re-renders

  // Call fetchStay only once when the component mounts or id changes
  // Using a ref to prevent multiple fetches
  const initialFetchDone = React.useRef(false);
  useEffect(() => {
    if (id && id !== 'new' && !initialFetchDone.current) {
      fetchStay();
      initialFetchDone.current = true;
    }
  }, [id, fetchStay]);

  // Fetch amenities only once when component mounts
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        // Directly query the amenities from Supabase instead of using API
        const { data, error } = await supabase
          .from('amenities')
          .select('*')
          .eq('type', 'stay');

        if (error) throw error;
        
        // Store all available amenities
        setSelectedAmenities(data);
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setSelectedAmenities([]);
      }
    };

    fetchAmenities();
  }, []);

  // Only update location values when explicitly setting location, not on every render
  const updateFormLocation = useCallback((newLocation: typeof location) => {
    if (newLocation.address) {
      form.setValue('address', newLocation.address);
      form.setValue('zipcode', newLocation.zipcode);
      form.setValue('city', newLocation.city);
      form.setValue('state', newLocation.state);
      form.setValue('latitude', newLocation.latitude);
      form.setValue('longitude', newLocation.longitude);
      form.setValue('location_name', newLocation.displayLocation);
    }
  }, [form]);

  // Memoize handlers for child components to prevent unnecessary re-renders
  const handleAmenitiesChange = useCallback((amenities) => {
    setSelectedAmenities(amenities);
    // Only update form value when explicitly changing amenities
    form.setValue('amenities', amenities.map(a => a.id));
  }, [form]);

  const handleLocationChange = useCallback((newLocation) => {
    console.log('Location selected:', newLocation);
    const updatedLocation = {
      ...newLocation,
      displayLocation: newLocation.displayLocation || `${newLocation.city}, ${newLocation.state}`
    };
    setLocation(updatedLocation);
    
    // Use the dedicated function to update location-related form fields
    updateFormLocation(updatedLocation);
  }, [updateFormLocation]);

  // Simplified image upload handler with better state management
  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || uploading) return;
    
    // Set uploading mutex to prevent multiple simultaneous uploads
    setUploading(true);
    
    // Validate files before uploading
    const validFiles: File[] = [];
    const maxSizeMB = 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // 10MB in bytes
    
    // Check each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          title: "Error",
          description: `File ${file.name} exceeds the ${maxSizeMB}MB size limit`,
          variant: "destructive",
        });
        continue;
      }
      
      // Verify it's an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: `File ${file.name} is not a valid image`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }
    
    try {
      // Get the current images from the form
      const currentImages = form.getValues('images') || [];
      
      if (id && id !== 'new') {
        // We're editing an existing stay
        setLoading(true);
        let successCount = 0;
        
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          // Set as primary if it's the first image AND there are no current images
          const isPrimary = currentImages.length === 0 && i === 0;
          
          try {
            const result = await uploadStayImage(
              id,
              file,
              isPrimary,
              i
            );
            
            if (result) {
              const newImage = getFullImageUrl(result.image_path);
              currentImages.push(newImage);
              successCount++;
            }
          } catch (error) {
            console.error(`Error uploading image ${file.name}:`, error);
            // Continue with other files
          }
        }
        
        // Update form with successfully uploaded images in a single operation
        if (successCount > 0) {
          // Update state and form in a single batch
          setImages(currentImages);
          form.setValue('images', currentImages);
          
          toast({
            title: "Success",
            description: successCount === validFiles.length 
              ? "All images uploaded successfully" 
              : `${successCount} of ${validFiles.length} images uploaded successfully`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to upload any images",
            variant: "destructive",
          });
        }
        setLoading(false);
      } else {
        // For new stays, convert files to base64 for later upload
        try {
          const base64Images = await Promise.all(
            validFiles.map(async (file) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve(reader.result as string);
                };
                reader.onerror = () => {
                  reject(new Error(`Failed to read file ${file.name}`));
                };
                reader.readAsDataURL(file);
              });
            })
          );
          
          // Update in a single batch operation
          const updatedImages = [...currentImages, ...base64Images];
          setImages(updatedImages);
          form.setValue('images', updatedImages);
          
          toast({
            title: "Success",
            description: "Images added successfully",
          });
        } catch (error) {
          console.error('Error converting images to base64:', error);
          toast({
            title: "Error",
            description: "Failed to process images",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      
      // Clear the file input to allow re-selection of the same file
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [form, id, toast, getFullImageUrl, uploading]);

  const onSubmit = async (data: FormData) => {
    if (!location.address) {
      toast({
        title: "Error",
        description: "Please select a location",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Add location data to the form data
      const stayData = {
        ...data,
        address: location.address,
        zipcode: location.zipcode,
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.displayLocation || `${location.city}, ${location.state}`,
        // Ensure amenities is an array
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        // Preserve the existing status instead of always setting to draft
        status: data.status
      };

      // Process any existing images
      const existingImages = stayData.images?.filter((img: any) => 
        typeof img === 'string' && (img.startsWith('http') || img.startsWith('/uploads/'))
      ) || [];

      let stayId = id;
      
      if (id && id !== 'new') {
        // Update existing stay
        await updateStay(id, stayData);
        toast({
          title: "Success",
          description: "Stay updated successfully",
        });
      } else {
        // Create new stay
        const newStay = await createStay(stayData);
        stayId = newStay.id;
        toast({
          title: "Success",
          description: "Stay created successfully",
        });
        
        // Refresh user data to update host status in the UI
        await refreshUser();
      }

      // Handle new image uploads if we have a valid stayId
      if (stayId && data.images && data.images.length > 0) {
        try {
          // Get only new images (not already URLs)
          const newImages = data.images.filter((img: any) => 
            !(typeof img === 'string' && (img.startsWith('http') || img.startsWith('/uploads/')))
          );
          
          // Try to upload each image one by one
          for (let i = 0; i < newImages.length; i++) {
            const img: any = newImages[i];
            
            try {
              // Skip if it's null or undefined
              if (!img) continue;
              
              // Handle base64 images
              if (typeof img === 'string' && img.includes('base64')) {
                const base64Data = img.split(',')[1];
                const mimeType = img.split(',')[0].split(':')[1].split(';')[0];
                const byteCharacters = atob(base64Data);
                const byteArrays = [];
                
                for (let j = 0; j < byteCharacters.length; j++) {
                  byteArrays.push(byteCharacters.charCodeAt(j));
                }
                
                const byteArray = new Uint8Array(byteArrays);
                const blob = new Blob([byteArray], { type: mimeType });
                const fileObject = new File([blob], `image_${i}.jpg`, { type: mimeType });
                
                // Upload the file
                await uploadStayImage(
                  stayId.toString(), 
                  fileObject,
                  i === 0 && existingImages.length === 0, // Set as primary if it's the first image
                  i
                );
              } 
              // Handle File objects
              else if (img && typeof img === 'object' && 'name' in img && 'type' in img) {
                await uploadStayImage(
                  stayId.toString(), 
                  img, 
                  i === 0 && existingImages.length === 0, // Set as primary if it's the first image
                  i
                );
              }
            } catch (innerError) {
              console.error(`Error uploading image ${i}:`, innerError);
              // Continue with next image
            }
          }
          
          if (newImages.length > 0) {
            toast({
              title: "Success",
              description: "Images uploaded successfully",
            });
          }
        } catch (error) {
          console.error('Error handling image uploads:', error);
          toast({
            title: "Warning",
            description: "Stay was saved but some images failed to upload",
            variant: "destructive",
          });
        }
      }

      // Navigate back to the dashboard
      navigate('/host/dashboard');
    } catch (error) {
      console.error('Error saving stay:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save stay",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">
        {id && id !== 'new' ? 'Edit Stay' : 'Create Stay'}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Cozy Beach House" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your property..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Display Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Will be auto-filled from map selection" 
                        {...field} 
                        readOnly 
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_per_night"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Night</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="99.99"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Guests</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="beds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beds</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Amenities</Label>
                <AmenitiesSelect
                  selectedAmenities={selectedAmenities}
                  type="stay"
                  onAmenitiesChange={handleAmenitiesChange}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Simple image upload UI */}
                        <div className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            disabled={loading}
                            onChange={(e) => handleImageUpload(e.target.files)}
                          />
                          <label htmlFor="image-upload" className="flex flex-col items-center justify-center text-sm text-gray-600 cursor-pointer">
                            {loading ? (
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            ) : (
                              <>
                                <div className="h-10 w-10 mb-2 text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </div>
                                <p className="text-center">
                                  Drag & drop images here, or click to select
                                  <br />
                                  <span className="text-xs text-gray-400">
                                    PNG, JPG, GIF up to 10MB
                                  </span>
                                </p>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Display uploaded images */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {field.value?.map((url, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-video">
                              <img 
                                src={typeof url === 'string' ? url : URL.createObjectURL(url as unknown as Blob)}
                                alt={`Stay image ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                <button 
                                  onClick={() => {
                                    const newImages = [...field.value];
                                    newImages.splice(index, 1);
                                    field.onChange(newImages);
                                  }}
                                  type="button"
                                  className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full p-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Location</FormLabel>
                <MapLocationPicker
                  value={location}
                  onChange={handleLocationChange}
                  error={form.formState.errors.address?.message}
                />
                {!location.address && (
                  <p className="text-sm text-red-500">
                    Please select a location to publish
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Availability</Label>
                <div className="flex space-x-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Select Dates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={setSelectedDates}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  {selectedDates.map((date) => (
                    <div key={date.toISOString()} className="flex items-center space-x-4">
                      <span>{format(date, 'PPP')}</span>
                      <Input
                        type="number"
                        placeholder="Price override"
                        className="w-32"
                        onChange={(e) => {
                          const availability = form.getValues('availability') || [];
                          const newAvailability = [
                            ...availability,
                            {
                              date: format(date, 'yyyy-MM-dd'),
                              is_available: true,
                              price_override: Number(e.target.value)
                            }
                          ];
                          form.setValue('availability', newAvailability);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/host/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            {id && id !== 'new' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  form.setValue('status', form.getValues('status') === 'published' ? 'draft' : 'published');
                  form.handleSubmit(onSubmit)();
                }}
                disabled={loading || !location.address}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  form.getValues('status') === 'published' ? "Unpublish" : "Publish"
                )}
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !location.address}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {id && id !== 'new' ? "Saving Changes..." : "Creating Stay..."}
                </div>
              ) : (
                id && id !== 'new' ? "Save Changes" : "Create Stay"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="font-mono text-sm">
            Location: {JSON.stringify(location, null, 2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default HostStay;