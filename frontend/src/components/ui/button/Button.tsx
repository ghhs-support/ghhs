import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Additional classes
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2.5 rounded-lg border font-medium transition-colors duration-200";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
  };

  const variantClasses = {
    primary:
      "border-brand-500 bg-brand-500 text-white hover:border-brand-600 hover:bg-brand-600 disabled:border-brand-500/50 disabled:bg-brand-500/50 dark:border-brand-400 dark:bg-brand-400 dark:hover:border-brand-300 dark:hover:bg-brand-300",
    outline:
      "border-gray-300 bg-transparent text-gray-600 hover:border-gray-400 hover:text-gray-700 disabled:border-gray-200 disabled:text-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {startIcon && startIcon}
      {children}
      {endIcon && endIcon}
    </button>
  );
};

export default Button;
