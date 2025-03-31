import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { getOrCreateConversation } from '@/services/chatService';
import { useAuth } from './AuthContext';
import { ConversationResponse } from '@/types/chat';

// Type for our conversation cache
interface ConversationCache {
  [key: string]: string; // cacheKey -> conversationId
}

// Interface for the ChatContext
interface ChatContextType {
  // Get conversation ID (from cache or create new)
  getConversationId: (
    otherUserId: string,
    listingId?: string,
    listingType?: 'food_experience' | 'stay',
    listingTitle?: string
  ) => Promise<string>;
  
  // Preload a conversation for future use
  preloadConversation: (
    otherUserId: string,
    listingId?: string,
    listingType?: 'food_experience' | 'stay',
    listingTitle?: string
  ) => void;
  
  // Check if a conversation is already cached
  isConversationCached: (otherUserId: string) => boolean;
  
  // Get a cached conversation ID if it exists
  getCachedConversationId: (otherUserId: string) => string | undefined;
  
  // Clear the conversation cache
  clearCache: () => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper function to generate a cache key for two user IDs
const generateCacheKey = (userId: string, otherUserId: string) => {
  return [userId, otherUserId].sort().join('-');
};

// Provider component
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const conversationCache = useRef<ConversationCache>({});
  const pendingPreloads = useRef<Set<string>>(new Set());
  
  // Get a conversation ID, either from cache or by creating a new one
  const getConversationId = async (
    otherUserId: string,
    listingId?: string,
    listingType?: 'food_experience' | 'stay',
    listingTitle?: string
  ): Promise<string> => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User must be authenticated to get a conversation');
    }
    
    // Check if the user is trying to message themselves
    if (user.id === otherUserId) {
      throw new Error('Cannot create a conversation with yourself');
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(user.id, otherUserId);
    
    // Return from cache if available
    if (conversationCache.current[cacheKey]) {
      return conversationCache.current[cacheKey];
    }
    
    // Otherwise create or get the conversation
    const { conversationId } = await getOrCreateConversation(
      user.id,
      otherUserId,
      listingId,
      listingType,
      listingTitle
    );
    
    // Cache the result
    conversationCache.current[cacheKey] = conversationId;
    
    return conversationId;
  };
  
  // Preload a conversation for future use
  const preloadConversation = (
    otherUserId: string,
    listingId?: string,
    listingType?: 'food_experience' | 'stay',
    listingTitle?: string
  ) => {
    if (!isAuthenticated || !user?.id) return;
    
    // Skip if the user is trying to message themselves
    if (user.id === otherUserId) return;
    
    // Generate cache key
    const cacheKey = generateCacheKey(user.id, otherUserId);
    
    // Skip if already cached or pending
    if (conversationCache.current[cacheKey] || pendingPreloads.current.has(cacheKey)) {
      return;
    }
    
    // Mark as pending
    pendingPreloads.current.add(cacheKey);
    
    // Start preloading
    setTimeout(async () => {
      try {
        const { conversationId } = await getOrCreateConversation(
          user.id,
          otherUserId,
          listingId,
          listingType,
          listingTitle
        );
        
        // Cache the result
        conversationCache.current[cacheKey] = conversationId;
        console.log(`[ChatContext] Preloaded conversation: ${cacheKey} -> ${conversationId}`);
      } catch (error) {
        console.error('[ChatContext] Error preloading conversation:', error);
      } finally {
        // Remove from pending
        pendingPreloads.current.delete(cacheKey);
      }
    }, 1000); // Delay to not block rendering
  };
  
  // Check if a conversation is cached
  const isConversationCached = (otherUserId: string): boolean => {
    if (!user?.id) return false;
    const cacheKey = generateCacheKey(user.id, otherUserId);
    return !!conversationCache.current[cacheKey];
  };
  
  // Get a cached conversation ID
  const getCachedConversationId = (otherUserId: string): string | undefined => {
    if (!user?.id) return undefined;
    const cacheKey = generateCacheKey(user.id, otherUserId);
    return conversationCache.current[cacheKey];
  };
  
  // Clear the cache
  const clearCache = () => {
    conversationCache.current = {};
    pendingPreloads.current.clear();
  };
  
  // Reset cache when user changes
  useEffect(() => {
    clearCache();
  }, [user?.id]);
  
  // Provide the context
  return (
    <ChatContext.Provider
      value={{
        getConversationId,
        preloadConversation,
        isConversationCached,
        getCachedConversationId,
        clearCache
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 