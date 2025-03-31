# Chat System Performance Optimizations

We've made several optimizations to the chat system to improve loading speed and overall performance. These changes include:

## Database Optimizations

1. Created SQL functions to optimize data retrieval:
   - `get_user_conversations_with_details` - Fetches all conversations for a user in a single query
   - `get_conversation_by_id` - Gets a full conversation with all its details in one query

2. Optimized the message retrieval to fetch messages and sender info in a single query

## Frontend Optimizations

1. Added message caching to prevent redundant data fetches
2. Used memoization for expensive calculations and rendering
3. Optimized the subscription system to better handle multiple listeners
4. Improved error handling and state management

## How to Apply These Changes

### 1. Run SQL Migrations

First, you need to apply the database functions. You can do this by running the SQL migration:

```bash
cd platform
npx supabase migration up --file 20240626_optimize_chat_queries.sql
```

Or you can manually run the SQL in the Supabase SQL editor.

### 2. Update TypeScript Interfaces

Make sure your TypeScript interfaces match the new data structure from the optimized queries. The key files to check are:

- `platform/src/types/chat.ts`

### 3. Verify Functionality

After applying the changes, test the chat system to ensure:

1. Conversations load quickly
2. Messages appear immediately 
3. New messages are properly received through the subscription
4. No duplicate messages appear
5. Message sending works correctly

## Performance Benefits

The optimizations provide several key benefits:

1. **Reduced Query Count**: Consolidated multiple small queries into single optimized queries
2. **Cached Data**: Prevented redundant fetches of the same data
3. **Optimized Rendering**: Reduced unnecessary re-renders with memoization
4. **Better Subscription Management**: Improved how real-time message subscriptions are handled

## Troubleshooting

If you encounter issues after applying these optimizations:

1. Check browser console logs for any errors
2. Verify that the SQL functions were properly created in Supabase
3. Check that your TypeScript interfaces match the data structure
4. Clear browser cache if seeing stale data

## Monitoring

We've added performance timing logs (`console.time` and `console.timeEnd`) to key functions. Monitor these in the browser console to ensure the optimizations are working as expected.

## Important Fix for SQL Function Error

If you encounter an error like `column p.user_id does not exist` when using the SQL functions, you need to apply a fix to the SQL functions. This error occurs because we are accessing the jsonb array incorrectly.

To fix the error, apply the updated SQL function from the `deploy_fixed_chat_sql.sql` file:

```bash
cd platform
# Run the SQL in Supabase SQL editor or via CLI
```

The fix changes how we access the fields in the jsonb objects:

```sql
-- INCORRECT (causes the error):
'id', p.user_id,
'name', p.name,
'avatar_url', p.avatar_url

-- CORRECT (fixed version):
'id', p->>'user_id',
'name', p->>'name',
'avatar_url', p->>'avatar_url'
```

This fix applies to the `get_user_conversations_with_details` function, which now correctly accesses the fields in the jsonb objects. 

## Fix for Foreign Key Relationship Error

If you encounter an error like `Could not find a relationship between 'messages' and 'profiles' in the schema cache`, you need to apply another fix. This error occurs because PostgREST can't automatically determine the relationship between tables without proper foreign key constraints.

To fix this issue, we've added a new SQL function `get_messages_with_senders` that:

1. Manually joins the messages and profiles tables
2. Returns the combined data as a JSON array
3. Doesn't rely on PostgREST's automatic relationship detection

The `getMessages` function in `chatService.ts` now tries to use this optimized function first, and falls back to the old method if there's any issue.

To apply this fix, run the updated SQL from `deploy_fixed_chat_sql.sql`:

```bash
cd platform
# Run the SQL in Supabase SQL editor or via CLI
```

This approach avoids the foreign key relationship error while still providing the performance benefits of a single database query. 

## Optimizations for StayDetails Page

The StayDetails page was experiencing slower chat loading times compared to other pages. We've implemented several optimizations specific to this use case:

### 1. Preloading Chat Data

We've added preloading functionality to start fetching conversation data as soon as the StayDetails page loads, rather than waiting for the user to click the "Message Host" button. This is done through:

1. A global conversation cache in the ChatButton component
2. Preloading that starts shortly after the component mounts (with a small delay to prioritize page rendering)
3. Passing the preloaded conversation ID to the ChatDialog when opened

### 2. Multiple Levels of Caching

We now have three levels of caching for conversations:

1. **Component-level caching**: Each ChatInterface component caches messages it has loaded
2. **Component instance caching**: The ChatDialog component caches conversation IDs
3. **Global caching**: The ChatButton component maintains a global cache shared across all instances

### 3. Smart Loading Sequence

The optimized loading sequence is:

1. Page loads → ChatButton starts preloading conversation data after a short delay (1s)
2. When user clicks "Message Host" → ChatDialog checks for preloaded conversation ID
3. If available, immediately sets up chat without loading
4. ChatInterface checks message cache before fetching from database

### 4. Implementation Details

Key changes:

- Added `preloadedConversationId` prop to ChatDialog component
- Created a global cache for conversation IDs in ChatButton
- ChatDialog now prioritizes using preloaded data
- Updated dependency arrays to properly react to changes

These optimizations significantly reduce the time between clicking "Message Host" and seeing chat messages, especially on repeat visits. 