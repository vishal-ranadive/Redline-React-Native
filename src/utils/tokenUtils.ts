import { jwtDecode } from 'jwt-decode';

/**
 * Check if a JWT token is expired
 * @param token - The JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  try {
    const decoded: any = jwtDecode(token);
    
    // Check if token has expiration claim
    if (decoded.exp) {
      // exp is in seconds, Date.now() is in milliseconds
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      
      // Add a small buffer (30 seconds) to account for clock skew
      const bufferTime = 30 * 1000;
      
      return currentTime >= (expirationTime - bufferTime);
    }
    
    // If no exp claim, assume token is valid (some tokens don't expire)
    return false;
  } catch (error) {
    // If we can't decode the token, consider it expired/invalid
    console.warn('Failed to decode token for expiration check:', error);
    return true;
  }
};

