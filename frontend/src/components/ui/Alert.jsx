import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

/**
 * Reusable Alert component for clinical alerts, red-flag banners, and regulatory notices.
 */
export default function Alert({
  children,
  title,
  variant = 'info', // 'info' | 'warning' | 'redflag' | 'success' | 'disclaimer'
  className = '',
  icon: CustomIcon,
  action,
}) {
  const configs = {
    info: {
      icon: Info,
      wrapper: 'bg-sky-50/80 border-sky-200 text-sky-900',
      iconColor: 'text-sky-600',
    },
    warning: {
      icon: AlertTriangle,
      wrapper: 'bg-amber-50/90 border-amber-300 text-amber-950',
      iconColor: 'text-amber-600',
    },
    redflag: {
      icon: ShieldAlert,
      wrapper: 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm ring-1 ring-rose-300/40',
      iconColor: 'text-rose-600',
    },
    success: {
      icon: CheckCircle2,
      wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      iconColor: 'text-emerald-600',
    },
    disclaimer: {
      icon: AlertCircle,
      wrapper: 'bg-slate-50 border-slate-300 text-slate-800 text-xs',
      iconColor: 'text-slate-500',
    },
  };

  const current = configs[variant] || configs.info;
  const IconComponent = CustomIcon || current.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${current.wrapper} ${className}`}>
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-1 tracking-tight">{title}</h4>}
        <div className="text-sm leading-relaxed opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
