-- Fixed get_user_conversations_with_details function
CREATE OR REPLACE FUNCTION get_user_conversations_with_details(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH user_conversations AS (
    -- Get all conversations the user is part of
    SELECT c.id, c.title, c.listing_id, c.listing_type, c.status, c.created_at, c.last_message_at
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = user_id_param
    ORDER BY c.last_message_at DESC NULLS LAST
  ),
  
  conversation_participants AS (
    -- Get all participants for these conversations
    SELECT 
      cp.conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ) as participants
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id IN (SELECT id FROM user_conversations)
    GROUP BY cp.conversation_id
  ),
  
  last_messages AS (
    -- Get the last message for each conversation
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'sender_id', m.sender_id,
        'created_at', m.created_at,
        'sender', jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ) as last_message
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE m.conversation_id IN (SELECT id FROM user_conversations)
    ORDER BY m.conversation_id, m.created_at DESC
  )
  
  -- Combine all the data
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', uc.id,
        'title', uc.title,
        'listing_id', uc.listing_id,
        'listing_type', uc.listing_type,
        'status', uc.status,
        'created_at', uc.created_at,
        'last_message_at', uc.last_message_at,
        'participants', COALESCE(cp.participants, '[]'::jsonb),
        'lastMessage', lm.last_message,
        'otherParticipant', (
          SELECT jsonb_build_object(
            'id', p->>'user_id',
            'name', p->>'name',
            'avatar_url', p->>'avatar_url'
          )
          FROM jsonb_array_elements(cp.participants) AS p
          WHERE p->>'user_id' != user_id_param::text
          LIMIT 1
        )
      )
    ) INTO result
  FROM 
    user_conversations uc
    LEFT JOIN conversation_participants cp ON uc.id = cp.conversation_id
    LEFT JOIN last_messages lm ON uc.id = lm.conversation_id;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get messages with sender info in a single query
CREATE OR REPLACE FUNCTION get_messages_with_senders(conversation_id_param UUID, limit_param INTEGER DEFAULT 50, offset_param INTEGER DEFAULT 0)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH message_data AS (
    -- Get messages for the conversation
    SELECT 
      m.id,
      m.conversation_id,
      m.sender_id,
      m.content,
      m.created_at,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'avatar_url', p.avatar_url
      ) as sender
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE m.conversation_id = conversation_id_param
    ORDER BY m.created_at DESC
    LIMIT limit_param
    OFFSET offset_param
  )
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', md.id,
      'conversation_id', md.conversation_id,
      'sender_id', md.sender_id,
      'content', md.content,
      'created_at', md.created_at,
      'sender', md.sender
    )
  ) INTO result
  FROM message_data md;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
