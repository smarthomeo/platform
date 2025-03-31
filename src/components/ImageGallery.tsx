import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, MinusCircle, Image as ImageIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Image {
  url: string;
  order?: number;
  caption?: string;
}

interface ImageGalleryProps {
  images: Image[];
  onDelete?: (url: string) => void;
  onReorder?: (newOrder: string[]) => void;
  editable?: boolean;
  initialIndex?: number;
}

export const ImageGallery = ({ 
  images, 
  onDelete, 
  onReorder,
  editable = false,
  initialIndex = 0
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (!images || !images.length) return null;

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onReorder) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items.map(item => item.url));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // Mobile carousel view
  const MobileView = () => (
    <div className="relative group md:hidden">
      <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
        <img
          src={images[currentIndex].url}
          srcSet={`${images[currentIndex].url} 480w,
                  ${images[currentIndex].url} 640w,
                  ${images[currentIndex].url} 768w`}
          sizes="(max-width: 480px) 100vw,
                 (max-width: 640px) 100vw,
                 768px"
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onClick={() => openLightbox(currentIndex)}
        />
        
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                previousImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full 
                       bg-black/50 text-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full 
                       bg-black/50 text-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {editable && onDelete && (
          <button
            onClick={() => onDelete(images[currentIndex].url)}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 
                     text-white"
            aria-label="Delete image"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-center mt-2 gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 
                       ${index === currentIndex ? 'bg-primary' : 'bg-gray-300'}`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Desktop grid view with consistent layout
  const DesktopView = () => {
    return (
      <div className="hidden md:block">
        <div className="flex gap-2 rounded-xl overflow-hidden h-[400px]">
          {/* Main large image - always show first image */}
          <div className="flex-grow-[3] relative overflow-hidden rounded-lg">
            <img
              src={images[0].url}
              srcSet={`${images[0].url} 640w,
                      ${images[0].url} 960w,
                      ${images[0].url} 1280w`}
              sizes="(max-width: 640px) 100vw,
                     (max-width: 960px) 75vw,
                     1280px"
              alt={`Main Image`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onClick={() => openLightbox(0)}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-4">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                View All Photos
              </Button>
            </div>
            
            {editable && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(images[0].url);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 
                         text-white opacity-0 group-hover:opacity-100 
                         transition-opacity duration-200"
                aria-label="Delete image"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Side thumbnails column */}
          <div className="flex-grow-[1] grid grid-cols-2 gap-2">
            {/* First thumbnail slot */}
            {images.length > 1 ? (
              <div className="relative aspect-square overflow-hidden rounded-lg group">
                <img
                  src={images[1].url}
                  srcSet={`${images[1].url} 400w,
                          ${images[1].url} 600w`}
                  sizes="(max-width: 400px) 100vw,
                         600px"
                  alt={`Thumbnail 1`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onClick={() => openLightbox(1)}
                  loading="lazy"
                />
                {editable && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(images[1].url);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 
                             text-white opacity-0 group-hover:opacity-100 
                             transition-opacity duration-200"
                    aria-label="Delete image"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              // Empty placeholder for consistent layout
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
            
            {/* Second thumbnail slot with "more" indicator if needed */}
            {images.length > 2 ? (
              <div className="relative aspect-square overflow-hidden rounded-lg group">
                <img
                  src={images[2].url}
                  srcSet={`${images[2].url} 400w,
                          ${images[2].url} 600w`}
                  sizes="(max-width: 400px) 100vw,
                         600px"
                  alt={`Thumbnail 2`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onClick={() => openLightbox(2)}
                  loading="lazy"
                />
                
                {/* If there are more than 3 images, show a "more" overlay */}
                {images.length > 3 && (
                  <div 
                    className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium cursor-pointer"
                    onClick={() => openLightbox(3)}
                  >
                    +{images.length - 3} more
                  </div>
                )}
                
                {editable && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(images[2].url);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 
                             text-white opacity-0 group-hover:opacity-100 
                             transition-opacity duration-200"
                    aria-label="Delete image"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              // Empty placeholder for consistent layout
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Lightbox view
  const LightboxView = () => (
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <DialogContent className="max-w-screen-xl h-[90vh] flex flex-col p-0 gap-0">
        <div className="relative flex-1 flex items-center justify-center bg-black/95 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[currentIndex].url}
              srcSet={`${images[currentIndex].url} 1200w,
                      ${images[currentIndex].url} 1600w,
                      ${images[currentIndex].url} 2048w`}
              sizes="(max-width: 1200px) 100vw,
                     (max-width: 1600px) 100vw,
                     2048px"
              alt={`Image ${currentIndex + 1} in fullscreen`}
              className="max-h-full max-w-full object-contain"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full 
                           bg-black/50 text-white hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full 
                           bg-black/50 text-white hover:bg-black/70"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 
                     text-white hover:bg-black/70"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Image caption or counter */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70 text-white text-center">
            <p>
              {images[currentIndex].caption || `Image ${currentIndex + 1} of ${images.length}`}
            </p>
          </div>
        </div>
        
        {/* Thumbnails at the bottom */}
        <div className="bg-black/90 p-4">
          <div className="grid grid-cols-6 gap-2 max-w-3xl mx-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-square rounded overflow-hidden ${
                  index === currentIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {isMobile ? <MobileView /> : <DesktopView />}
      <LightboxView />
    </DragDropContext>
  );
}; 