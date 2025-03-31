import { supabase } from '@/integrations/supabase/client';
import type { 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  MessageWithSender,
  ConversationResponse
} from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

// Cache for active subscriptions to avoid duplicate subscriptions
const activeSubscriptions: Record<string, RealtimeChannel> = {};

// Track callbacks by conversation ID
const activeCallbacks: Record<string, Array<(message: Message) => void>> = {};

/**
 * Creates a new conversation or returns an existing one between two users
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string,
  listingType?: 'food_experience' | 'stay',
  title?: string
): Promise<ConversationResponse> {
  console.log('Starting getOrCreateConversation with:', { userId, otherUserId, listingId, listingType });
  
  try {
    // First, check if a conversation already exists between these users
    const { data: existingConversations, error: existingConvError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (existingConvError) {
      console.error('Error fetching existing conversations:', existingConvError);
      throw existingConvError;
    }

    console.log('Found existing conversations for current user:', existingConversations?.length || 0);

    if (existingConversations && existingConversations.length > 0) {
      const conversationIds = existingConversations.map(c => c.conversation_id);
      console.log('Conversation IDs to check:', conversationIds);

      const { data: matchingConversations, error: matchingConvError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', conversationIds);

      if (matchingConvError) {
        console.error('Error checking for matching conversations:', matchingConvError);
        throw matchingConvError;
      }

      console.log('Found matching conversations with other user:', matchingConversations?.length || 0);

      if (matchingConversations && matchingConversations.length > 0) {
        // Found existing conversation
        console.log('Returning existing conversation:', matchingConversations[0].conversation_id);
        return {
          conversationId: matchingConversations[0].conversation_id,
          isNew: false
        };
      }
    }

    console.log('Creating new conversation...');
    // No existing conversation found, create a new one
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        listing_type: listingType,
        title,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    console.log('New conversation created:', newConversation?.id);

    // Add both participants to the conversation
    console.log('Adding participants to conversation...');
    
    const currentUserResult = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: newConversation.id, user_id: userId });
      
    if (currentUserResult.error) {
      console.error('Error adding current user to conversation:', currentUserResult.error);
      throw currentUserResult.error;
    }
    
    console.log('Current user added to conversation');
    
    const otherUserResult = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: newConversation.id, user_id: otherUserId });
      
    if (otherUserResult.error) {
      console.error('Error adding other user to conversation:', otherUserResult.error);
      throw otherUserResult.error;
    }
    
    console.log('Other user added to conversation');

    return {
      conversationId: newConversation.id,
      isNew: true
    };
  } catch (error) {
    console.error('Unexpected error in getOrCreateConversation:', error);
    throw error;
  }
}

/**
 * Sends a new message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
}

/**
 * Fetches messages for a conversation with pagination
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<MessageWithSender[]> {
  console.time('getMessages');
  try {
    // First, try using our optimized function
    const { data: messagesData, error: funcError } = await supabase
      .rpc('get_messages_with_senders', { 
        conversation_id_param: conversationId,
        limit_param: limit,
        offset_param: offset
      });

    if (!funcError && messagesData) {
      // Parse and return the data from our optimized function
      const messages = messagesData as any[];
      
      // Add isCurrentUser flag
      const processedMessages = messages.map(msg => ({
        ...msg,
        isCurrentUser: false // This will be updated in the component based on current user
      }));
      
      return processedMessages;
    }
    
    // If the function fails, fall back to the old method with separate queries
    console.warn('RPC function failed, using fallback method:', funcError);
    
    // First, get the messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Then get the sender profiles for those messages
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    
    const { data: senderProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', senderIds);
      
    if (profilesError) {
      console.error('Error fetching sender profiles:', profilesError);
      // Continue with messages but without sender info
    }
    
    // Map profiles to a dictionary for quick lookup
    const profilesMap = (senderProfiles || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
    
    // Merge messages with sender info
    return messages.map(message => ({
      ...message,
      sender: profilesMap[message.sender_id] || null
    }));
  } finally {
    console.timeEnd('getMessages');
  }
}

/**
 * Fetches a conversation by ID with participants
 */
export async function getConversationById(
  conversationId: string
): Promise<ConversationWithDetails | null> {
  try {
    console.time('getConversationById');
    // Get conversation with all its details in a single query
    const { data, error } = await supabase
      .rpc('get_conversation_by_id', { conversation_id_param: conversationId });

    if (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    console.timeEnd('getConversationById');
    return data;
  } catch (error) {
    console.error('Error in getConversationById:', error);
    throw error;
  }
}

/**
 * Fetches all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
  try {
    console.log('Fetching conversations for user:', userId);
    console.time('getUserConversations');
    
    // Get all conversations where the user is a participant with a more optimized query
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations_with_details', { user_id_param: userId });

    if (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.timeEnd('getUserConversations');
    console.log('Fetched conversations:', conversations?.length || 0);
    
    return conversations || [];
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Sets up a realtime subscription to messages for a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
): () => void {
  // Keep track of this callback
  if (!activeCallbacks[conversationId]) {
    activeCallbacks[conversationId] = [];
  }
  
  // Add this callback to our list if it's not already there
  if (!activeCallbacks[conversationId].includes(callback)) {
    activeCallbacks[conversationId].push(callback);
  }

  // Check if we already have an active subscription for this conversation
  if (activeSubscriptions[conversationId]) {
    console.log(`Reusing existing subscription for conversation: ${conversationId}, total callbacks: ${activeCallbacks[conversationId].length}`);
    
    // Return a function that will remove just this callback
    return () => {
      console.log(`Removing single callback for conversation: ${conversationId}`);
      const index = activeCallbacks[conversationId].indexOf(callback);
      if (index !== -1) {
        activeCallbacks[conversationId].splice(index, 1);
      }
      
      // If no more callbacks, remove the subscription
      if (activeCallbacks[conversationId].length === 0) {
        console.log(`No more callbacks for conversation: ${conversationId}, removing subscription`);
        unsubscribeFromMessages(conversationId);
      }
    };
  }

  console.log(`Setting up new subscription for conversation: ${conversationId}`);
  
  try {
    // Set up the subscription
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log(`New message received for conversation: ${conversationId}, notifying ${activeCallbacks[conversationId]?.length || 0} listeners`);
          
          // Notify all callbacks for this conversation
          const callbacks = activeCallbacks[conversationId] || [];
          callbacks.forEach(cb => {
            try {
              cb(payload.new as Message);
            } catch (e) {
              console.error('Error in message callback:', e);
            }
          });
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for conversation ${conversationId}:`, status);
      });

    // Store the subscription in our cache
    activeSubscriptions[conversationId] = channel;
  } catch (error) {
    console.error('Error setting up subscription:', error);
  }

  // Return a function that will remove just this callback
  return () => {
    console.log(`Removing single callback for conversation: ${conversationId}`);
    const index = activeCallbacks[conversationId].indexOf(callback);
    if (index !== -1) {
      activeCallbacks[conversationId].splice(index, 1);
    }
    
    // If no more callbacks, remove the subscription
    if (activeCallbacks[conversationId].length === 0) {
      console.log(`No more callbacks for conversation: ${conversationId}, removing subscription`);
      unsubscribeFromMessages(conversationId);
    }
  };
}

/**
 * Removes a realtime subscription for a conversation
 */
export function unsubscribeFromMessages(conversationId: string): void {
  const channel = activeSubscriptions[conversationId];
  if (channel) {
    try {
      console.log(`Completely removing subscription for conversation: ${conversationId}`);
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('Error removing channel:', error);
    } finally {
      delete activeSubscriptions[conversationId];
      // Also clean up any callbacks
      if (activeCallbacks[conversationId]) {
        delete activeCallbacks[conversationId];
      }
    }
  } else {
    console.log(`No active subscription found for conversation: ${conversationId}`);
  }
}

/**
 * Updates the status of a conversation (active, archived)
 */
export async function updateConversationStatus(
  conversationId: string,
  status: 'active' | 'archived'
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ status })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation status:', error);
    throw error;
  }
}

/**
 * Check if the current user is a participant in the conversation
 */
export async function isParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return false;
    }
    throw error;
  }

  return !!data;
} 