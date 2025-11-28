import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  resize = 'vertical',
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#2a2a3e] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors';
  
  const resizeClasses = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: 'resize-y'
  };
  
  const borderClasses = error
    ? 'border-red-500/50 focus:border-red-500'
    : 'border-white/10 focus:border-blue-500/50';
  
  const classes = `
    ${baseClasses}
    ${resizeClasses[resize]}
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
      
      <textarea
        className={classes}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-400' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Textarea;
