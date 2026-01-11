import { forwardRef, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

/**
 * Select size types
 */
export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * Select option type
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for Select component
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Size of the select */
  size?: SelectSize;
  /** Options to display */
  options: SelectOption[];
  /** Error message to display */
  error?: string;
  /** Label for the select */
  label?: string;
  /** Helper text below the select */
  helperText?: string;
  /** Placeholder option text */
  placeholder?: string;
  /** Whether the select should take full width */
  fullWidth?: boolean;
}

/**
 * Size styles
 */
const SIZE_STYLES: Record<SelectSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

/**
 * Select Component
 *
 * A reusable select component with label and error support.
 *
 * TODO: Add search/filter functionality
 * TODO: Add multi-select support
 * TODO: Add custom option rendering
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      options,
      error,
      label,
      helperText,
      placeholder,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        {/* Select */}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full rounded-md border bg-gray-800',
            'text-gray-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'appearance-none cursor-pointer',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-primary-500 focus:border-primary-500',
            SIZE_STYLES[size],
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error Message */}
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
