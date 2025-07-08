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
  let inputClasses = `h-11 w-full rounded-lg border-0 px-4 py-2.5 text-sm 
    bg-[#1C2537] text-white placeholder:text-gray-500 
    focus:ring-1 focus:ring-blue-500 
    focus:outline-none ${className}`;

  if (disabled) {
    inputClasses += ` opacity-40 cursor-not-allowed`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300`;
  } else if (success) {
    inputClasses += ` border-success-500 focus:border-success-300`;
  }

  return (
    <div className="relative">
      {label && (
        <div className="flex justify-between mb-2">
          <label htmlFor={id || name} className="text-gray-300 text-sm">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {optional && <span className="text-gray-500 text-sm">(optional)</span>}
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
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : success ? "text-success-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
