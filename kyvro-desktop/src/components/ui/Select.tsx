import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#2a2a3e] border rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer';
  
  const borderClasses = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-white/10 focus:border-blue-500/50';
  
  const classes = `
    ${baseClasses}
    ${borderClasses}
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <select className={classes} {...props}>
        <option value="" disabled className="bg-[#2a2a3e]">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-[#2a2a3e]"
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Select;
