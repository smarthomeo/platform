# Platform2025: Comprehensive Product Requirements Document

## 1. System Architecture
- **Frontend**: React.js with TypeScript, Vite, Tailwind CSS, Shadcn UI components
- **Backend**: Flask (Python), MySQL database
- **Deployment**: Docker containerization, nginx for frontend serving
- **Authentication**: JWT-based authentication, Google OAuth integration

## 2. Database Schema
- **Users**: User management (id, email, password, name, host status)
- **Food Experiences**: User-hosted food experiences (title, description, price, cuisine, menu, location)
- **Stays**: Accommodation listings (title, description, price, rooms, location)
- **Images**: Image management for food experiences and stays
- **Amenities**: Available amenities for stays and food experiences
- **Availability**: Calendar management for food experiences and stays
- **Reviews**: User reviews for both food experiences and stays

## 3. Core Functionality

### 3.1 Authentication
- User registration with email/password
- Login with email/password
- Google OAuth integration
- JWT-based session management
- Protected routes requiring authentication

### 3.2 User Types
- **Regular Users**: Can browse and book experiences/stays
- **Hosts**: Can create and manage food experiences and accommodations
- **Admin**: Special privileges for featuring listings

### 3.3 Food Experiences
- Create/edit/delete food experiences
- Upload and manage multiple images with ordering
- Set availability and pricing
- Manage location details and amenities
- View and respond to bookings

### 3.4 Stays (Accommodations)
- Create/edit/delete stay listings
- Upload and manage multiple images with ordering
- Set availability calendar and pricing
- Manage location details and amenities
- Specify room details (bedrooms, bathrooms, max guests)

### 3.5 Browsing & Discovery
- Featured food experiences and stays on homepage
- Search food experiences and stays
- Filter by location, price, amenities
- View nearby listings based on geolocation
- View details of specific listings

### 3.6 Admin Functions
- Toggle featured status for food experiences
- Toggle featured status for stays
- Manage amenities database

## 4. API Endpoints

### 4.1 Authentication
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user info
- `/api/auth/logout` - User logout
- `/api/auth/google/verify` - Verify Google OAuth token

### 4.2 Host Operations
- `/api/host/food-experiences` - CRUD for food experiences
- `/api/host/food-experiences/:id/images` - Manage food experience images
- `/api/host/stays` - CRUD for stay listings
- `/api/host/stays/:id/images` - Manage stay images
- `/api/host/stays/:id/availability` - Manage stay availability

### 4.3 Public Listing Endpoints
- `/api/food-experiences` - Get published food experiences
- `/api/stays` - Get published stays
- `/api/food-experiences/:id` - Get food experience details
- `/api/stays/:id` - Get stay details
- `/api/featured-food` - Get featured food experiences
- `/api/featured-stays` - Get featured stays
- `/api/food-categories` - Get food categories
- `/api/listings/nearby` - Get nearby listings based on coordinates

### 4.4 Admin Endpoints
- `/api/admin/food-experiences/:id/toggle-featured` - Toggle featured status
- `/api/admin/stays/:id/toggle-featured` - Toggle featured status
- `/api/amenities` - Get all amenities

### 4.5 Utility Endpoints
- `/api/upload` - Upload images
- `/api/uploads/:filename` - Serve uploaded files

## 5. Frontend Structure

### 5.1 Pages
- **Home**: Featured listings and search
- **Food**: Browse food experiences
- **Stays**: Browse accommodation listings
- **FoodDetails/StayDetails**: Detailed view of a listing
- **BecomeHost**: Information about hosting
- **Host Dashboard**: Host management interface
- **Auth Pages**: Login, Signup
- **Profile**: User profile management

### 5.2 Components
- Navigation and layout components
- Card components for listings
- Form components for creating/editing listings
- Image upload and gallery components
- Calendar and availability components
- Authentication components
- Search and filter components

## 6. Technical Requirements

### 6.1 Performance
- Image optimization for faster loading
- Efficient database queries with proper indexing
- Pagination for listing results

### 6.2 Security
- Password hashing (SHA-256)
- JWT token authentication with expiration
- Protected API endpoints with token verification
- CORS configuration for API access control

### 6.3 Responsiveness
- Mobile-friendly interface using Tailwind CSS
- Responsive design for all pages

### 6.4 Data Integrity
- Database constraints and relationships
- Input validation on both frontend and backend
- Error handling and user feedback

## 7. Environment Variables
- Database configuration (host, user, password, database name)
- Secret keys for JWT generation
- Google OAuth credentials
- Base URL configuration
- CORS settings

## 8. Deployment Configuration
- Docker containers for frontend, backend, and database
- Nginx configuration for frontend serving
- Database initialization scripts
- Persistent volume for uploaded files

## 9. Data Models

### 9.1 User
- id (PK)
- email (unique)
- password (hashed)
- name
- is_host
- image
- created_at

### 9.2 Food Experience
- id (PK)
- host_id (FK to users)
- title
- description
- location details (name, address, coordinates)
- price_per_person
- cuisine_type
- menu_description
- duration
- max_guests
- language
- status (draft, published, archived)
- is_featured
- created_at/updated_at

### 9.3 Stay
- id (PK)
- host_id (FK to users)
- title
- description
- location details (name, address, coordinates)
- price_per_night
- max_guests
- bedrooms
- bathrooms
- is_featured
- status (draft, published, archived)
- created_at/updated_at

### 9.4 Images
- id (PK)
- experience_id/stay_id (FK)
- image_path
- is_primary
- display_order
- created_at

### 9.5 Amenities
- id (PK)
- name
- category
- type (stay, food, both)

## 10. Integration Points
- Google Maps/API for location services
- Google OAuth for authentication
- Image processing libraries (PIL)
- Possibly payment integration (not currently implemented) 