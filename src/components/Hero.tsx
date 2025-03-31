import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getImagePath } from '@/utils/imageUtils';

const Hero = () => {
  // Define image with fallback strategy
  const heroImagePath = getImagePath('/images/african.jpg');
  
  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
      <img
          src={heroImagePath}
          alt="Local food and stays"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Try different path variations if the image fails to load
            if (!target.src.includes('african.jpg')) {
              // First try with the /images prefix
              target.src = '/images/african.jpg';
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      </div>

      {/* Hero Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fadeIn">
          Discover Local Flavors & 
          <span className="text-amber-400"> Authentic Stays</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl animate-fadeIn delay-100">
          Connect with local hosts offering unique dining experiences and cozy accommodations
        </p>

        {/* Search Bar */}
        
      </div>
    </div>
  );
};

export default Hero; 