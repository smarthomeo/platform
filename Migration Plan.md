# Migration Plan: Platform2025 Backend Transition to Supabase + Clerk

## Overview
This document outlines the migration plan from the current Flask/MySQL backend to a Supabase backend with Clerk authentication while preserving the existing React/TypeScript frontend.

##
- **Frontend**: React + TypeScript + Vite + ShadCN UI (to be preserved)
- **Backend**: Flask (Python) + MySQL (to be replaced)
- **Authentication**: Custom JWT with Google OAuth (to be replaced)

## Target Architecture
- **Frontend**: React + TypeScript + Vite + ShadCN UI (unchanged)
- **Backend**: Supabase (PostgreSQL, Storage, Functions)
- **Authentication**: Clerk

## 1. Database Migration

### 1.1 Table Structure Migration

| Current MySQL Table | Supabase Equivalent | Notes |
|---------------------|---------------------|-------|
| users | auth.users (Clerk) + public.user_profiles | User auth managed by Clerk; profile data in Supabase |
| food_experiences | public.food_experiences | Core data remains similar |
| food_experience_images | public.food_experience_images | Link to Supabase Storage |
| food_experience_availability | public.food_experience_availability | Same structure |
| stays | public.stays | Core data remains similar |
| stay_images | public.stay_images | Link to Supabase Storage |
| stay_amenities | public.stay_amenities | Same structure |
| stay_availability | public.stay_availability | Same structure |
| amenities | public.amenities | Same structure |
| reviews | public.reviews | Same structure |

### 1.2 Schema Changes
- Replace integer primary keys with UUIDs for Supabase compatibility
- Replace MySQL-specific data types with PostgreSQL equivalents
- Implement Row-Level Security (RLS) policies for all tables

### 1.3 Data Migration Steps
1. Export data from MySQL using scripts
2. Transform data to match new schema (IDs, relationships)
3. Import into Supabase tables
4. Verify data integrity after migration

## 2. Authentication Migration (Clerk)

### 2.1 Setup Clerk Project
1. Create a Clerk application
2. Configure OAuth providers (Google) to match current system
3. Set up Clerk webhooks to sync user data to Supabase

### 2.2 Frontend Auth Integration
1. Replace current JWT auth with ClerkProvider
2. Implement SignIn, SignUp, and UserProfile components
3. Replace current protected routes with Clerk's protection
4. Update authentication context to use Clerk hooks

### 2.3 User Data Synchronization
1. Create a webhook handler to sync Clerk user creation/updates to the Supabase user_profiles table
2. Implement "host" status synchronization between systems

## 3. API Replacement with Supabase

### 3.1 Core API Replacements

| Current API | Supabase Replacement | Notes |
|-------------|----------------------|-------|
| Authentication API | Clerk API | Full replacement |
| Food Experience CRUD | Supabase Database CRUD + RLS policies | Direct table access + server functions |
| Stay CRUD | Supabase Database CRUD + RLS policies | Direct table access + server functions |
| Image Uploads | Supabase Storage | Replace custom upload system |
| Listing Search | Supabase Database queries + pgvector for location | Implement full-text search |
| Admin Operations | Supabase Database CRUD + RLS admin policies | Restrict with RLS policies |

### 3.2 Supabase Edge Functions
Create the following Edge Functions to handle complex operations:
1. `processImage` - For image optimization and processing
2. `searchNearby` - For location-based searches
3. `syncAvailability` - For complex calendar operations
4. `notifyUsers` - For notification services

## 4. Frontend Adaptation

### 4.1 API Client Updates
1. Replace current axios/fetch API calls with Supabase client
2. Update authentication context to use Clerk
3. Update form submissions to work with Supabase

### 4.2 Real-time Features
Implement Supabase real-time subscriptions for:
1. Chat/messaging system
2. Availability updates
3. Booking notifications

## 5. Supabase Setup Details

### 5.1 Database Structure
```sql
-- User profiles (extended from Clerk)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Food experiences
CREATE TABLE public.food_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.user_profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  price_per_person DECIMAL(10, 2) NOT NULL,
  cuisine_type TEXT NOT NULL,
  menu_description TEXT NOT NULL,
  duration TEXT DEFAULT '2 hours',
  max_guests INTEGER DEFAULT 8,
  language TEXT DEFAULT 'English',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  address TEXT NOT NULL DEFAULT '',
  zipcode TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  latitude DECIMAL(10,8) NOT NULL DEFAULT 0,
  longitude DECIMAL(11,8) NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE
);

-- Add remaining tables with similar structure to MySQL but adapted for PostgreSQL
```

### 5.2 Row-Level Security (RLS) Policies
```sql
-- Example RLS policies for food_experiences
ALTER TABLE public.food_experiences ENABLE ROW LEVEL SECURITY;

-- Anyone can read published experiences
CREATE POLICY "Published experiences are viewable by everyone" 
ON public.food_experiences FOR SELECT 
USING (status = 'published');

-- Hosts can CRUD their own experiences
CREATE POLICY "Hosts can manage their own experiences" 
ON public.food_experiences FOR ALL 
USING (host_id = auth.uid());

-- Admin can manage all experiences
CREATE POLICY "Admins can manage all experiences" 
ON public.food_experiences FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND admin = true
));
```

### 5.3 Storage Buckets
```
- food-experience-images
- stay-images
- user-profiles
```

## 6. Implementation Strategy

### 6.1 Phased Approach
1. **Phase 1**: Set up Supabase project and database schema
2. **Phase 2**: Implement Clerk authentication
3. **Phase 3**: Migrate core data and implement basic CRUD
4. **Phase 4**: Implement advanced features (search, real-time)
5. **Phase 5**: Testing and validation
6. **Phase 6**: Production deployment

### 6.2 Environment Variables
```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_clerk_key
CLERK_SECRET_KEY=sk_clerk_key

# App Configuration
VITE_APP_URL=http://localhost:3000
```

## 7. API Function Reference

### 7.1 Food Experiences

```typescript
// Get food experiences
const getFoodExperiences = async (filters: FoodFilter) => {
  let query = supabase
    .from('food_experiences')
    .select('*, food_experience_images(*), user_profiles(*)')
    .eq('status', 'published');
  
  // Apply filters
  if (filters.cuisine) query = query.eq('cuisine_type', filters.cuisine);
  if (filters.maxPrice) query = query.lte('price_per_person', filters.maxPrice);
  if (filters.location) {
    // Use nearby function for location
    return await supabase.functions.invoke('searchNearby', {
      body: { type: 'food', ...filters }
    });
  }
  
  return await query;
};

// More functions following similar pattern
```

## 8. Clerk Authentication Integration

### 8.1 Setup in React App

```typescript
// src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### 8.2 Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;
  
  return children;
};
```

## 9. Important Considerations

1. **Data Integrity**: Ensure no data loss during migration
2. **Feature Parity**: Verify all current functionality is preserved
3. **Performance**: Test for any performance changes, especially in search
4. **Cost Analysis**: Understand Supabase and Clerk pricing tiers
5. **Backup Strategy**: Implement regular database backups

## 10. Success Metrics

1. All current functionality available in new architecture
2. Equal or better performance metrics
3. Successful migration of all user data
4. No regression in user experience 