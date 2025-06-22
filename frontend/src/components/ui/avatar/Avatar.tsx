import { useState } from 'react';

interface AvatarProps {
  src: string; // URL of the avatar image
  alt?: string; // Alt text for the avatar
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"; // Avatar size
  status?: "online" | "offline" | "busy" | "none"; // Status indicator
  fallbackInitials?: string; // Initials to show if image fails to load
}

const sizeClasses = {
  xsmall: "h-6 w-6 max-w-6",
  small: "h-8 w-8 max-w-8",
  medium: "h-10 w-10 max-w-10",
  large: "h-12 w-12 max-w-12",
  xlarge: "h-14 w-14 max-w-14",
  xxlarge: "h-16 w-16 max-w-16",
};

const textSizeClasses = {
  xsmall: "text-xs",
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
  xlarge: "text-lg",
  xxlarge: "text-xl",
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5 max-w-1.5",
  small: "h-2 w-2 max-w-2",
  medium: "h-2.5 w-2.5 max-w-2.5",
  large: "h-3 w-3 max-w-3",
  xlarge: "h-3.5 w-3.5 max-w-3.5",
  xxlarge: "h-4 w-4 max-w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  size = "medium",
  status = "none",
  fallbackInitials,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  return (
    <div className={`relative rounded-full ${sizeClasses[size]}`}>
      {/* Avatar Image */}
      {!imageError && (
        <img 
          src={src} 
          alt={alt} 
          className={`object-cover rounded-full w-full h-full transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}

      {/* Fallback Initials */}
      {(imageError || !imageLoaded) && fallbackInitials && (
        <div className={`
          flex items-center justify-center w-full h-full rounded-full 
          bg-gradient-to-br from-brand-500 to-brand-600 
          text-white font-semibold ${textSizeClasses[size]}
          ${imageError ? 'opacity-100' : 'opacity-0'}
        `}>
          {fallbackInitials}
        </div>
      )}

      {/* Loading state for when no fallback is provided */}
      {(imageError || !imageLoaded) && !fallbackInitials && (
        <div className={`
          flex items-center justify-center w-full h-full rounded-full 
          bg-gray-300 dark:bg-gray-600 animate-pulse
          ${imageError ? 'opacity-100' : 'opacity-0'}
        `}>
          <svg className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Status Indicator */}
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
            statusSizeClasses[size]
          } ${statusColorClasses[status] || ""}`}
        ></span>
      )}
    </div>
  );
};

export default Avatar;
