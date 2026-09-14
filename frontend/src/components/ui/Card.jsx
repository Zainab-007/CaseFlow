import React from 'react';

/**
 * Reusable Card component for Clinical Dashboard & Patient Kiosk.
 */
export default function Card({
  children,
  className = '',
  kioskInteractive = false,
  selected = false,
  onClick,
  ...props
}) {
  const interactiveStyles = kioskInteractive
    ? `cursor-pointer transition-all duration-150 active:scale-[0.98] ${
        selected
          ? 'ring-4 ring-teal-600 border-teal-600 bg-teal-50/50 shadow-md'
          : 'hover:border-teal-400 hover:shadow-md'
      }`
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`font-semibold text-slate-900 text-base tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
