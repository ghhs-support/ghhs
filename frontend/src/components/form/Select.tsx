import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  label?: string;
  value?: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  value = "",
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          value
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        <option
          value=""
          disabled
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
