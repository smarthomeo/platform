// Define the types for the chat functionality
import { User } from '@supabase/supabase-js';

// Base conversation type from database
export interface Conversation {
  id: string;
  created_at: string;
  last_message_at: string;
  listing_id?: string;
  listing_type?: 'food_experience' | 'stay';
  title?: string;
  status: 'active' | 'archived';
}

// Participant in a conversation
export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

// Base message type
export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// Extended message type with sender information
export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  isCurrentUser?: boolean; // Helper for UI, true if message was sent by current user
}

// Extended conversation type with additional UI fields
export interface ConversationWithDetails extends Conversation {
  participants: {
    user_id: string;
    name?: string;
    avatar_url?: string;
  }[];
  lastMessage?: MessageWithSender;
  unreadCount?: number;
  otherParticipant?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

// Props for the ChatInterface component
export interface ChatInterfaceProps {
  conversationId: string;
  otherParticipantId?: string;
  listingId?: string;
  listingType?: 'food_experience' | 'stay';
  onClose?: () => void;
  isHost?: boolean;
}

// Response type for getOrCreateConversation
export interface ConversationResponse {
  conversationId: string;
  isNew: boolean;
} 