import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
let supabase;

export const initializeSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // We'll handle sessions manually
      },
    }
  );
  
  return supabase;
};

// Get the Supabase client
export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client has not been initialized. Call initializeSupabase() first.');
  }
  return supabase;
};

// Auth functions
export const signUpWithEmail = async (email, password, userData) => {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${userData.firstName} ${userData.lastName}`.trim(),
        avatar_url: userData.avatarUrl,
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email, password) => {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (accessToken) => {
  const { data, error } = await getSupabase().auth.getUser(accessToken);
  if (error) throw error;
  return data.user;
};

// File upload
export const uploadFile = async (bucket, path, file, options = {}) => {
  const { data, error } = await getSupabase()
    .storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      ...options,
    });

  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket, path) => {
  const { data } = getSupabase()
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Realtime subscriptions
export const subscribeToChannel = (channel, callback) => {
  const subscription = getSupabase()
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
};

export default {
  initializeSupabase,
  getSupabase,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentUser,
  uploadFile,
  getPublicUrl,
  subscribeToChannel,
};
