import React from 'react';

/**
 * Reusable Badge component for clinical source tags, triage, and statuses.
 */
export default function Badge({
  children,
  variant = 'default', // 'default' | 'urgent' | 'priority' | 'routine' | 'source-patient' | 'source-doc' | 'verified' | 'pending'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold',
    lg: 'text-sm px-3.5 py-1.5 rounded-full font-semibold',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-750 border border-slate-250',
    urgent: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold tracking-wide animate-pulse',
    priority: 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold',
    routine: 'bg-slate-100 text-slate-700 border border-slate-200',
    'source-patient': 'bg-sky-50 text-sky-800 border border-sky-200 font-medium',
    'source-doc': 'bg-purple-50 text-purple-800 border border-purple-200 font-medium',
    verified: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
    pending: 'bg-amber-50 text-amber-800 border border-amber-250 font-medium',
    edited: 'bg-blue-50 text-blue-800 border border-blue-250 font-medium',
    rejected: 'bg-rose-50 text-rose-800 border border-rose-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase tracking-wider ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {variant === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>}
      {variant === 'priority' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
      {variant === 'verified' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
      {children}
    </span>
  );
}
