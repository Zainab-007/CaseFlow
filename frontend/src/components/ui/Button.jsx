import React from 'react';

/**
 * Reusable Button Component for CaseFlow
 * Supports Kiosk Big Action (for touch screens/elderly patients),
 * Clinical Professional, Danger/Alert, and Subtle variants.
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'kiosk' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg' | 'kiosk-xl'
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-lg gap-2',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5 shadow-sm',
    'kiosk-xl': 'text-xl px-8 py-5 rounded-2xl gap-3 font-semibold shadow-md active:scale-[0.98]',
  };

  const variantStyles = {
    primary: 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm border border-teal-800',
    kiosk: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white ring-4 ring-teal-700/20 text-xl font-bold tracking-wide shadow-lg',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-5 h-5 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-5 h-5 shrink-0" />}
    </button>
  );
}
