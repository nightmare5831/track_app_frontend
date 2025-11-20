import { Platform } from 'react-native';

export const API_CONFIG = {
  BASE_URL: Platform.select({
    android: 'https://track-app-backend-flame.vercel.app/api',
    ios: 'https://track-app-backend-flame.vercel.app/api',
    web: 'https://track-app-backend-flame.vercel.app/api',
    default: 'https://track-app-backend-flame.vercel.app/api',
  }),
  TIMEOUT: 5000, // Reduced from 10s to 5s for faster failure/retry
};
