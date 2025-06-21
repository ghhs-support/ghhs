import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { CalenderIcon } from "../../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  value?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  value,
}: PropsType) {
  const flatpickrInstance = useRef<any>(null);

  useEffect(() => {
    if (!flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(`#${id}`, {
        mode: mode || "single",
        static: true,
        monthSelectorType: "static",
        dateFormat: "Y-m-d", // Internal format
        altInput: true,
        altFormat: "d-m-Y", // Display format
        defaultDate: value || defaultDate,
        onChange,
        allowInput: true,
        clickOpens: true,
        disableMobile: false,
      });
    }

    // Update the instance when value changes
    if (flatpickrInstance.current && !Array.isArray(flatpickrInstance.current)) {
      if (!value) {
        flatpickrInstance.current.clear();
      } else if (value !== flatpickrInstance.current.selectedDates[0]?.toISOString().split('T')[0]) {
        flatpickrInstance.current.setDate(value, false);
      }
    }

    return () => {
      if (flatpickrInstance.current && !Array.isArray(flatpickrInstance.current)) {
        flatpickrInstance.current.destroy();
        flatpickrInstance.current = null;
      }
    };
  }, [mode, onChange, id, value, defaultDate]);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
} 