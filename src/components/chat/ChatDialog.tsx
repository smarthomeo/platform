import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChatInterface } from './ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { toast } from 'sonner';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  listingId?: string;
  listingType?: 'food_experience' | 'stay';
  listingTitle?: string;
  preloadedConversationId?: string;
}

export function ChatDialog({ 
  isOpen, 
  onOpenChange, 
  otherUserId, 
  listingId,
  listingType,
  listingTitle,
  preloadedConversationId
}: ChatDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const { getConversationId } = useChat();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSelfMessage, setIsSelfMessage] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const conversationInitializedRef = useRef(false);

  useEffect(() => {
    // If we have a preloaded conversation ID, use it immediately
    if (preloadedConversationId && isOpen && !conversationInitializedRef.current) {
      console.log("[ChatDialog] Using preloaded conversation ID:", preloadedConversationId);
      setConversationId(preloadedConversationId);
      conversationInitializedRef.current = true;
      return;
    }

    const initConversation = async () => {
      // Skip if already initialized or dialog is not open
      if (conversationInitializedRef.current || !isOpen) {
        return;
      }

      // Check if all required data is available
      if (!isAuthenticated || !user?.id) {
        console.log("[ChatDialog] Skipping conversation initialization - conditions not met");
        return;
      }

      // Check if otherUserId is missing
      if (!otherUserId) {
        console.log("[ChatDialog] Other user ID is missing");
        setError("Host information is missing. Unable to start conversation.");
        return;
      }

      // Check if the user is trying to message themselves
      if (user.id === otherUserId) {
        console.log("[ChatDialog] Self-messaging detected");
        setIsSelfMessage(true);
        return;
      }

      try {
        setLoading(true);
        setError(undefined);
        
        // Get the conversation ID through our context
        const convId = await getConversationId(
          otherUserId,
          listingId,
          listingType,
          listingTitle
        );
        
        console.log(`[ChatDialog] Got conversation ID: ${convId}`);
        
        setConversationId(convId);
        conversationInitializedRef.current = true;
      } catch (error) {
        console.error('[ChatDialog] Error initializing conversation:', error);
        setError("Failed to start conversation. Please try again later.");
        toast.error('Failed to start conversation');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    initConversation();

    // Only reset the initialization flag when the dialog actually closes
    let isCurrentlyOpen = isOpen;
    return () => {
      if (isCurrentlyOpen && !isOpen) {
        conversationInitializedRef.current = false;
        setConversationId(null);
      }
    };
  }, [isOpen, user?.id, otherUserId, isAuthenticated, listingId, listingType, listingTitle, onOpenChange, getConversationId, preloadedConversationId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] h-[600px] p-0 overflow-hidden flex flex-col"
      >
        <VisuallyHidden>
          <DialogTitle>Chat with Host</DialogTitle>
        </VisuallyHidden>
        
        {isAuthenticated ? (
          conversationId ? (
            <ChatInterface 
              conversationId={conversationId}
              otherParticipantId={otherUserId}
              listingId={listingId}
              listingType={listingType}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto" />
                    <p className="mt-4">Setting up your conversation...</p>
                  </>
                ) : isSelfMessage ? (
                  <>
                    <p className="text-lg">You can't message yourself</p>
                    <p className="text-sm text-muted-foreground mt-1">Please message another user</p>
                  </>
                ) : error ? (
                  <>
                    <p className="text-lg">{error}</p>
                    <p className="text-sm text-muted-foreground mt-1">Please check the listing and try again</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg">Unable to start conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
                  </>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <p className="text-lg">Please sign in to chat</p>
              <p className="text-sm text-muted-foreground mt-1">You need to be logged in to send messages</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 