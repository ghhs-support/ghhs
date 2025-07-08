import type React from "react";
import type { FC } from "react";

interface InputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  type?: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
}

const Input: FC<InputProps> = ({
  label,
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  required,
  optional,
}) => {
  let inputClasses = `h-11 w-full rounded-lg border px-4 py-2.5 text-sm 
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
    border-gray-300 dark:border-gray-600 
    placeholder:text-gray-500 dark:placeholder:text-gray-400
    focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
    focus:border-blue-500 dark:focus:border-blue-400
    focus:outline-none ${className}`;

  if (disabled) {
    inputClasses += ` opacity-40 cursor-not-allowed`;
  } else if (error) {
    inputClasses += ` border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400`;
  } else if (success) {
    inputClasses += ` border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400 dark:focus:border-green-400 dark:focus:ring-green-400`;
  }

  return (
    <div className="relative">
      {label && (
        <div className="flex justify-between mb-2">
          <label htmlFor={id || name} className="text-gray-700 dark:text-gray-300 text-sm">
            {label}
            {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
          </label>
          {optional && <span className="text-gray-500 dark:text-gray-400 text-sm">(optional)</span>}
        </div>
      )}
      <input
        type={type}
        id={id || name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-red-500 dark:text-red-400" : success ? "text-green-500 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
