import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { ChatDialog } from './ChatDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { toast } from 'sonner';

interface ChatButtonProps extends ButtonProps {
  hostId: string;
  listingId: string;
  listingType: 'food_experience' | 'stay';
  listingTitle: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function ChatButton({
  hostId,
  listingId,
  listingType,
  listingTitle,
  variant = 'default',
  className,
  children,
  ...props
}: ChatButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { preloadConversation, getCachedConversationId } = useChat();

  // Preload conversation data when component mounts
  useEffect(() => {
    // Only preload if authenticated and has a valid hostId
    if (isAuthenticated && user?.id && hostId) {
      preloadConversation(hostId, listingId, listingType, listingTitle);
    }
  }, [isAuthenticated, user?.id, hostId, listingId, listingType, listingTitle, preloadConversation]);

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to message the host', {
        description: 'You need to be logged in to start a conversation',
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/login'
        }
      });
      return;
    }
    
    setIsDialogOpen(true);
  };

  // Only render the ChatDialog when the dialog is actually open
  // This prevents unnecessary renders and state changes when closed
  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleClick}
        {...props}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {children || 'Message Host'}
      </Button>

      {isDialogOpen && (
        <ChatDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          otherUserId={hostId}
          listingId={listingId}
          listingType={listingType}
          listingTitle={listingTitle}
          preloadedConversationId={user?.id ? getCachedConversationId(hostId) : undefined}
        />
      )}
    </>
  );
} 