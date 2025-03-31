import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getMessages, 
  sendMessage, 
  subscribeToMessages,
  getConversationById,
} from '@/services/chatService';
import type { ChatInterfaceProps, MessageWithSender } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function ChatInterface({
  conversationId,
  otherParticipantId,
  listingId,
  listingType,
  onClose,
  isHost = false,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [otherParticipant, setOtherParticipant] = useState<{
    id: string;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const messagesCache = useRef<Record<string, MessageWithSender[]>>({});
  
  // Format message time with memoization
  const formatMessageTime = useCallback((dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Just now';
    }
  }, []);

  // Memoize getInitials function
  const getInitials = useCallback((name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);
  
  // Memoize message processing to prevent unnecessary renders
  const processedMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      formattedTime: formatMessageTime(msg.created_at)
    }));
  }, [messages, formatMessageTime]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        console.log('Fetching messages for conversation:', conversationId);
        
        // Check if we have cached messages for this conversation
        if (messagesCache.current[conversationId]) {
          console.log('Using cached messages for conversation:', conversationId);
          setMessages(messagesCache.current[conversationId]);
          setLoading(false);
          return;
        }
        
        const messageData = await getMessages(conversationId);
        
        // Add isCurrentUser flag to each message
        const processedMessages = messageData.map(msg => ({
          ...msg,
          isCurrentUser: msg.sender_id === user?.id
        }));
        
        const reversedMessages = processedMessages.reverse(); // Reverse to show oldest first
        setMessages(reversedMessages);
        
        // Cache the messages
        messagesCache.current[conversationId] = reversedMessages;
        
        // Fetch conversation details to get title and other participant
        const conversationData = await getConversationById(conversationId);
        if (conversationData) {
          setConversationTitle(conversationData.title || 'Chat');
          
          // Find the other participant
          const other = conversationData.participants.find(
            p => p.user_id !== user?.id
          );
          
          if (other) {
            setOtherParticipant({
              id: other.user_id,
              name: other.name,
              avatar_url: other.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId && user?.id) {
      fetchMessages();
    }
  }, [conversationId, user?.id]);

  // Set up real-time subscription in a separate effect
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    
    // Only set up subscription if we don't already have one for this conversation
    if (subscriptionRef.current) {
      console.log(`Using existing subscription for conversation: ${conversationId}`);
      return;
    }
    
    console.log(`Setting up subscription effect for conversation: ${conversationId}`);
    
    // Subscribe to new messages
    const unsubscribeFunction = subscribeToMessages(conversationId, (newMsg) => {
      // Only add the message if it's not from the current user
      // (we already optimistically add those when they're sent)
      if (newMsg.sender_id !== user?.id) {
        // Enhance the new message with isCurrentUser flag
        const enhancedMessage = {
          ...newMsg,
          isCurrentUser: false,
          sender: otherParticipant || undefined
        };
        
        // Update both state and cache
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === newMsg.id);
          if (exists) return prev;
          
          const updated = [...prev, enhancedMessage];
          // Update the cache
          messagesCache.current[conversationId] = updated;
          return updated;
        });
      }
    });
    
    subscriptionRef.current = unsubscribeFunction;
    
    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (subscriptionRef.current) {
        console.log(`Cleaning up subscription from effect for conversation: ${conversationId}`);
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, user?.id, otherParticipant]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user?.id || sending) {
      return;
    }

    try {
      setSending(true);
      
      // Optimistically add message to UI
      const optimisticMessage: MessageWithSender = {
        id: Date.now(), // Temporary ID
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage,
        created_at: new Date().toISOString(),
        isCurrentUser: true,
        sender: {
          id: user.id,
          name: user.name,
          avatar_url: user.picture || user.image
        }
      };
      
      // Update both the state and the cache
      const updatedMessages = [...messages, optimisticMessage];
      setMessages(updatedMessages);
      messagesCache.current[conversationId] = updatedMessages;
      
      setNewMessage('');
      
      // Actually send the message
      await sendMessage(conversationId, user.id, newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the optimistic message if it failed
      const filteredMessages = messages.filter(msg => 
        typeof msg.id === 'number' ? msg.id !== Date.now() : true
      );
      setMessages(filteredMessages);
      messagesCache.current[conversationId] = filteredMessages;
    } finally {
      setSending(false);
      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage 
              src={otherParticipant?.avatar_url || ''} 
              alt={otherParticipant?.name || 'User'}
            />
            <AvatarFallback>
              {getInitials(otherParticipant?.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{otherParticipant?.name || 'User'}</h3>
            <p className="text-xs text-muted-foreground">{conversationTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation by sending a message!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {processedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex ${
                    msg.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  } items-end gap-2 max-w-[80%]`}
                >
                  {!msg.isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={msg.sender?.avatar_url || ''}
                        alt={msg.sender?.name || 'User'}
                      />
                      <AvatarFallback>
                        {getInitials(msg.sender?.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <div className="break-words">{msg.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        msg.isCurrentUser
                          ? 'text-primary-foreground/70'
                          : 'text-secondary-foreground/70'
                      }`}
                    >
                      {msg.formattedTime}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t p-4 flex items-center gap-2"
      >
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sending || loading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || loading || !newMessage.trim()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
} 