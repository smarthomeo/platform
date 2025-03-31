-- RLS Policies for chat-related tables
-- This file contains SQL commands to set up Row Level Security for the chat feature
-- Run these in the Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS TABLE POLICIES
-- Users can view conversations they are part of
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can create conversations (they'll be restricted by conversation_participants)
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (true);

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- Allow users to see their own records (records where they are the participant)
CREATE POLICY "Users can view participants in their conversations"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid());

-- Allow users to see other participants in conversations they're part of
CREATE POLICY "Users can view other participants in their conversations"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT c.id 
    FROM conversations c
    WHERE EXISTS (
      SELECT 1 
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
      AND cp.user_id = auth.uid()
    )
  )
);

-- Allow users to add themselves to conversations
CREATE POLICY "Users can add themselves to conversations"
ON conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to add others to conversations they're part of
CREATE POLICY "Users can add others to their conversations"
ON conversation_participants FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT c.id 
    FROM conversations c
    WHERE EXISTS (
      SELECT 1 
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
      AND cp.user_id = auth.uid()
    )
  )
);

-- MESSAGES TABLE POLICIES
-- Users can view messages from conversations they participate in
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages to their conversations"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid()); 