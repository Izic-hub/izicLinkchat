import { supabase } from './supabaseClient';

/**
 * Modern, secure check to get the currently authenticated user.
 * Avoids the stale, cached session bug of the old version.
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error.message);
    return null;
  }
};

/**
 * Handles signing out and clearing the local token session safely.
 */
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
};

/**
 *  THE MISSING PIECE: Handles Google OAuth Sign-In
 * Triggers the redirect link to log in via a Google Account.
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This dynamically forces users back to whatever live page they started on
        redirectTo: window.location.origin, 
      },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google Auth initialization failed:', error.message);
    alert('Could not start Google sign-in: ' + error.message);
    return null;
  }
};
