// Reads values from .env (Vite exposes variables that start with VITE_)
export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'Another World',
  apiUrl: import.meta.env.VITE_API_URL || '',
  loginEndpoint: import.meta.env.VITE_LOGIN_ENDPOINT || '/auth/login',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || ''
};
