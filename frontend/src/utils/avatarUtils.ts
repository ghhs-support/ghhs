interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Generate a consistent avatar image URL based on user data
 * Uses available avatar images (user-01.jpg to user-37.jpg)
 */
export const generateUserAvatar = (user: User | undefined, userId: number): string => {
  if (!user) {
    // Use a consistent image based on user ID for unknown users
    const avatarIndex = (userId % 37) + 1;
    return `/images/user/user-${avatarIndex.toString().padStart(2, '0')}.jpg`;
  }

  // Use user email or name to generate a consistent avatar
  const identifier = user.email || `${user.first_name} ${user.last_name}`.trim() || userId.toString();
  const hash = identifier.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  const avatarIndex = (hash % 37) + 1;
  return `/images/user/user-${avatarIndex.toString().padStart(2, '0')}.jpg`;
};

/**
 * Generate user initials for fallback display
 */
export const generateUserInitials = (user: User | undefined, userId: number): string => {
  if (!user) return userId.toString().slice(-2);
  
  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  } else if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  
  return userId.toString().slice(-2);
};

/**
 * Generate a user display name from user data
 */
export const generateUserDisplayName = (user: User | undefined, userId: number): string => {
  if (!user) return `User ${userId}`;
  
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || user.email || `User ${userId}`;
};

/**
 * Check if an image URL is likely to be accessible in production
 * This is a basic check - in a real production app you might want more sophisticated logic
 */
export const isValidAvatarUrl = (url: string): boolean => {
  // Check if it's a local avatar image
  if (url.startsWith('/images/user/user-') && url.endsWith('.jpg')) {
    // Extract the number from the filename
    const match = url.match(/user-(\d+)\.jpg$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num >= 1 && num <= 37; // We have user-01.jpg to user-37.jpg
    }
  }
  
  // For external URLs, assume they're valid (could add more sophisticated checks)
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Get a fallback avatar URL that's guaranteed to exist
 */
export const getFallbackAvatarUrl = (): string => {
  return '/images/user/user-01.jpg'; // Always return the first avatar as fallback
}; 