import React from 'react';
import Badge from '../ui/Badge';
import { Calendar, FileText, Activity, Stethoscope, Clock } from 'lucide-react';

/**
 * Chronological Clinical Timeline component.
 * Synthesizes prior physical records, past prescriptions, and current intake.
 */
export default function ClinicalTimeline({ events = [] }) {
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'intake':
        return Activity;
      case 'lab investigation':
        return FileText;
      case 'radiology':
        return Activity;
      case 'consultation':
        return Stethoscope;
      default:
        return Calendar;
    }
  };

  const getSourceVariant = (source) => {
    if (source === 'patient-reported') return 'source-patient';
    if (source === 'document-extracted') return 'source-doc';
    return 'default';
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event, idx) => {
        const IconComponent = getCategoryIcon(event.category);
        const sourceVariant = getSourceVariant(event.source);

        return (
          <div key={idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-700 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-teal-600" />
            </div>

            {/* Event Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {event.date} {event.time && `• ${event.time}`}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {event.category}
                  </span>
                </div>

                <Badge variant={sourceVariant} size="sm">
                  {event.source}
                </Badge>
              </div>

              <h5 className="font-bold text-slate-900 text-sm mt-1">{event.title}</h5>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
