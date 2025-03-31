import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations } from '@/services/chatService';
import type { ConversationWithDetails } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ChatInterface } from './ChatInterface';

export function ConversationsList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const data = await getUserConversations(user.id);
        setConversations(data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up an interval to refresh conversations every minute
    const interval = setInterval(fetchConversations, 60000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const filteredConversations = searchQuery.trim() 
    ? conversations.filter(convo => 
        convo.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        convo.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const getListingTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const isStay = type === 'stay';
    
    return (
      <Badge variant="outline" className={`${isStay ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
        {isStay ? 'Stay' : 'Food'}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold mb-2">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className={`border-r ${selectedConversation ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading conversations...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              {searchQuery ? (
                <p className="text-muted-foreground">No conversations matching "{searchQuery}"</p>
              ) : (
                <>
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Messages from users will appear here</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="divide-y">
                {filteredConversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={`p-4 hover:bg-muted cursor-pointer ${
                      selectedConversation === convo.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(convo.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage
                          src={convo.otherParticipant?.avatar_url || ''}
                          alt={convo.otherParticipant?.name || 'User'}
                        />
                        <AvatarFallback>
                          {getInitials(convo.otherParticipant?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium truncate">
                            {convo.otherParticipant?.name || 'User'}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {getRelativeTime(convo.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getListingTypeBadge(convo.listing_type)}
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.title || 'No title'}
                          </p>
                        </div>
                        <p className="text-sm truncate mt-1">
                          {convo.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Conversation detail */}
        <div className={`${selectedConversation ? 'flex flex-col flex-1' : 'hidden'}`}>
          {selectedConversation ? (
            <ChatInterface
              conversationId={selectedConversation}
              onClose={() => setSelectedConversation(null)}
              isHost={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 