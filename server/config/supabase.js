import dotenv from 'dotenv';

dotenv.config();

// Initialize  client

export const initialize = () => {
  if (!process.env._URL || !process.env._ANON_KEY) {
    throw new Error('Missing  configuration. Please set _URL and _ANON_KEY in your .env file.');
  }
  
    process.env._URL,
    process.env._ANON_KEY,
    {
      auth: {
        persistSession: false, // We'll handle sessions manually
      },
    }
  );
  
};

// Get the  client
export const get = () => {
    throw new Error(' client has not been initialized. Call initialize() first.');
  }
};

// Auth functions
export const signUpWithEmail = async (email, password, userData) => {
  const { data, error } = await get().auth.signUp({
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
  const { data, error } = await get().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await get().auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (accessToken) => {
  const { data, error } = await get().auth.getUser(accessToken);
  if (error) throw error;
  return data.user;
};

// File upload
export const uploadFile = async (bucket, path, file, options = {}) => {
  const { data, error } = await get()
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
  const { data } = get()
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Realtime subscriptions
export const subscribeToChannel = (channel, callback) => {
  const subscription = get()
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
};

export default {
  initialize,
  get,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentUser,
  uploadFile,
  getPublicUrl,
  subscribeToChannel,
};
