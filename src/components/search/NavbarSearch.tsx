import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import LocationSearch from './LocationSearch';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export const NavbarSearch = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full md:w-[400px] justify-start text-left font-normal rounded-full"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search locations...</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle asChild>
          <VisuallyHidden>Search Locations</VisuallyHidden>
        </DialogTitle>
        <LocationSearch onLocationSelect={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}; 