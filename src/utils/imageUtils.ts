/**
 * Utility for handling image paths consistently across development and production environments
 */

/**
 * Resolves an image path, ensuring it works in both development and production environments
 * 
 * @param path The image path
 * @returns The resolved path
 */
export const getImagePath = (path: string): string => {
  // If the path is already a full URL, return it
  if (path.startsWith('http')) return path;
  
  // If path is a Supabase storage URL
  if (path.startsWith('food-experience-images/') || path.startsWith('stay-images/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${path}`;
  }
  
  // For local assets in /images or /stay-images directories
  if (path.startsWith('/')) {
    // Ensure the path is correct with no double slashes
    return path;
  }
  
  // If it's a relative path, assume it's from the /images directory
  return `/images/${path}`;
};

/**
 * Gets the full URL for an image stored in Supabase
 * 
 * @param url The image URL or path
 * @param type The type of content (food, stay, profile)
 * @returns The full URL
 */
export const getFullImageUrl = (url: string, type: 'food' | 'stay' | 'profile' = 'food'): string => {
  if (!url) {
    // Return default images based on content type
    if (type === 'food') return '/images/placeholder-food.jpg';
    if (type === 'profile') return '/images/kenji.jpg';
    return '/images/mountain.jpg';
  }
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) return url;
  
  // Handle Supabase storage URLs based on content type
  if (type === 'stay' && url.startsWith('stay-images/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  if (type === 'food' && url.startsWith('food-experience-images/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  if (type === 'profile' && url.startsWith('user-profiles/')) {
    return `${import.meta.env.VITE_SUPABASE_URL || 'https://bbrgntyiwuniovyoryta.supabase.co'}/storage/v1/object/public/${url}`;
  }
  
  // For any other path, just return it (it might be a local path like /images/...)
  return url;
}; 