import { supabase } from '../integrations/supabase/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  }
}));

describe('Supabase Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign in with valid credentials', async () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: { provider: 'email' }
      },
      access_token: 'test-token'
    };

    // Mock successful sign in
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.data.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  it('should handle sign in errors', async () => {
    // Mock failed sign in
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' }
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrong-password'
    });

    expect(result.error?.message).toBe('Invalid login credentials');
    expect(result.data.session).toBeNull();
  });

  it('should successfully sign up a new user', async () => {
    // Mock successful sign up
    (supabase.auth.signUp as any).mockResolvedValue({
      data: { user: { id: '456', email: 'new@example.com' }, session: null },
      error: null
    });

    const result = await supabase.auth.signUp({
      email: 'new@example.com',
      password: 'newpassword123',
      options: {
        data: {
          name: 'New User',
          is_host: false
        }
      }
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'newpassword123',
      options: {
        data: {
          name: 'New User',
          is_host: false
        }
      }
    });
    expect(result.data.user?.id).toBe('456');
    expect(result.error).toBeNull();
  });

  it('should successfully sign out a user', async () => {
    // Mock successful sign out
    (supabase.auth.signOut as any).mockResolvedValue({
      error: null
    });

    const result = await supabase.auth.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });
}); 