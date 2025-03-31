-- Create SQL function to get user conversations with details efficiently
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

-- Create SQL function to get a single conversation with all its details
CREATE OR REPLACE FUNCTION get_conversation_by_id(conversation_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH conversation_data AS (
    -- Get the conversation
    SELECT c.id, c.title, c.listing_id, c.listing_type, c.status, c.created_at, c.last_message_at
    FROM conversations c
    WHERE c.id = conversation_id_param
  ),
  
  participants_data AS (
    -- Get all participants with their profiles
    SELECT 
      conversation_id_param as conversation_id,
      jsonb_agg(
        jsonb_build_object(
          'user_id', cp.user_id,
          'name', p.name,
          'avatar_url', p.avatar_url
        )
      ) as participants
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id = conversation_id_param
    GROUP BY cp.conversation_id
  ),
  
  last_message_data AS (
    -- Get the last message with sender profile
    SELECT 
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
    WHERE m.conversation_id = conversation_id_param
    ORDER BY m.created_at DESC
    LIMIT 1
  )
  
  -- Combine all data
  SELECT 
    jsonb_build_object(
      'id', cd.id,
      'title', cd.title,
      'listing_id', cd.listing_id,
      'listing_type', cd.listing_type,
      'status', cd.status,
      'created_at', cd.created_at,
      'last_message_at', cd.last_message_at,
      'participants', COALESCE(pd.participants, '[]'::jsonb),
      'lastMessage', lmd.last_message
    ) INTO result
  FROM 
    conversation_data cd
    LEFT JOIN participants_data pd ON cd.id = pd.conversation_id
    LEFT JOIN last_message_data lmd ON cd.id = lmd.conversation_id;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql;
