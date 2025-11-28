import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#2a2a3e] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors';
  
  const iconPadding = icon 
    ? iconPosition === 'left' ? 'pl-10 pr-4' : 'pl-4 pr-10'
    : 'px-4';
  
  const borderClasses = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-white/10 focus:border-blue-500/50';
  
  const classes = `
    ${baseClasses}
    ${iconPadding}
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
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={classes}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
