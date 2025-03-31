import { supabase } from '../integrations/supabase/client';

// Simple test to check if Supabase connection is working
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test auth status - this will verify the connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Current session:', data.session ? 'Active' : 'None');
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
  }
}

// Run the test
testSupabaseConnection().then(() => {
  console.log('Connection test complete');
}); 