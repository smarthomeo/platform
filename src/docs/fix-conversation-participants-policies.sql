-- Fix for the infinite recursion in conversation_participants policies
-- Run these commands in the Supabase SQL Editor

-- First, drop ALL existing policies on the table to ensure clean slate
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view other participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add others to their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON conversation_participants;

-- Make sure RLS is enabled
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create the most basic policies possible to avoid any recursion issues

-- 1. Simple policy for users to view their own records
CREATE POLICY "view_own_participation"
ON conversation_participants FOR SELECT
USING (user_id = auth.uid());

-- 2. Let users view participants in conversations they're part of
-- Using the simplest possible self-join approach
CREATE POLICY "view_participants_in_own_conversations"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- 3. Simple policy for users to add themselves
CREATE POLICY "add_self_to_conversation"
ON conversation_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. Let users add others to conversations they're in
CREATE POLICY "add_others_to_own_conversations"
ON conversation_participants FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
); 