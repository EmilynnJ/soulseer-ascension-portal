

  throw new Error('Missing  URL or Anon Key');
}


export const getCurrentUser = async () => {
  return user;
};

export const signOut = async () => {
  window.location.href = '/login';
};
