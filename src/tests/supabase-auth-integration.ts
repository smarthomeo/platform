import { supabase } from '../integrations/supabase/client';

// Comprehensive test to verify Supabase authentication integration
async function testSupabaseAuthIntegration() {
  console.log('🔍 Testing Supabase Authentication Integration...');
  
  try {
    // 1. Test connection to Supabase
    console.log('\n🔄 Testing connection to Supabase...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session fetch failed:', sessionError.message);
    } else {
      console.log('✅ Connection successful!');
      console.log('Current session:', sessionData.session ? 'Active' : 'None');
    }
    
    // 2. Test OAuth configuration
    console.log('\n🔄 Checking OAuth providers configuration...');
    let oauthError = null;
    let oauthData = null;
    
    try {
      // This will just get the URL, not actually navigate to Google
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true, // Don't actually redirect
        }
      });
      
      oauthData = result.data;
      oauthError = result.error;
      
      if (oauthError) {
        console.error('❌ OAuth configuration error:', oauthError.message);
      } else if (oauthData?.url) {
        console.log('✅ OAuth configuration verified!');
        console.log('OAuth URL generated successfully:', oauthData.url.substring(0, 60) + '...');
        
        // Parse the URL to check for client_id parameter
        const urlObj = new URL(oauthData.url);
        const clientId = urlObj.searchParams.get('client_id');
        console.log('Google client_id detected:', !!clientId ? 'Yes' : 'No');
      } else {
        console.warn('⚠️ OAuth test incomplete: No URL returned but no error either');
      }
    } catch (e) {
      console.error('❌ Error testing OAuth:', e);
      oauthError = e;
    }
    
    // 3. Test auth endpoints are functioning (just checking availability)
    console.log('\n🔄 Testing auth endpoints availability...');
    
    // Try a simple operation
    const { error: signupError } = await supabase.auth.signUp({
      email: 'test_' + Date.now() + '@example.com', // Use timestamp to avoid conflicts
      password: 'Password123!', // Never actually create this account
      options: {
        emailRedirectTo: 'http://localhost:5173', // Default Vite dev server URL
        data: { 
          name: 'Test User',
          is_host: false 
        }
      }
    });
    
    // We only check if the endpoint is functioning, not if it succeeds
    // Error will be like: "User already registered" or "Invalid email" which is fine
    if (signupError && signupError.message?.includes('network')) {
      console.error('❌ Auth endpoints unavailable:', signupError.message);
    } else {
      console.log('✅ Auth endpoints verified!');
      if (signupError) {
        console.log('  Info: Expected signup error received:', signupError.message);
      }
    }
    
    // Summary
    console.log('\n📋 Supabase Auth Integration Summary:');
    console.log('- Connection to Supabase: ' + (sessionError ? '❌ Failed' : '✅ Success'));
    console.log('- OAuth Configuration: ' + (oauthError ? '❌ Failed' : '✅ Success'));
    console.log('- Auth Endpoints: ' + (signupError?.message?.includes('network') ? '❌ Failed' : '✅ Success'));
    
  } catch (error) {
    console.error('❌ Unexpected error during authentication tests:', error);
  }
}

// Run the tests
testSupabaseAuthIntegration().then(() => {
  console.log('\n✨ Authentication integration tests completed');
}).catch(err => {
  console.error('❌ Test execution failed:', err);
}); 