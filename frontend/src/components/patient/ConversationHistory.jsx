import React from 'react';
import { MessageSquare, Undo2, Bot, User, Mic } from 'lucide-react';

/**
 * Compact Conversation History Component
 * Displays turns between CaseFlow AI Assistant and the Patient,
 * with undo/step-back interaction.
 */
export default function ConversationHistory({
  history = [],
  onStepBack,
  className = ''
}) {
  if (!history || history.length === 0) {
    return (
      <div className={`p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium ${className}`}>
        Interview conversation history will display here as questions are answered.
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
          <span>Dialogue Record ({history.length} answers)</span>
        </div>
        {onStepBack && (
          <button
            type="button"
            onClick={onStepBack}
            className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo Last (पिछला बदलें)</span>
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
        {history.map((turn, index) => (
          <div key={index} className="space-y-1.5">
            {/* AI Prompt Bubble */}
            <div className="flex items-start gap-2 max-w-[90%]">
              <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3" />
              </div>
              <div className="bg-teal-50/70 border border-teal-100 rounded-2xl rounded-tl-none p-2.5 text-slate-800">
                <p className="font-bold">{turn.question_text}</p>
                {turn.hindi_question && (
                  <p className="text-[11px] text-teal-900 font-medium mt-0.5">{turn.hindi_question}</p>
                )}
              </div>
            </div>

            {/* Patient Response Bubble */}
            <div className="flex items-start gap-2 max-w-[90%] ml-auto justify-end">
              <div className="bg-slate-900 text-white rounded-2xl rounded-tr-none p-2.5 text-right">
                <div className="flex items-center justify-end gap-1 mb-0.5">
                  {turn.input_mode === 'voice' && <Mic className="w-2.5 h-2.5 text-teal-300" />}
                  <span className="text-[10px] text-slate-300 font-medium capitalize">
                    {turn.input_mode || 'touch'}
                  </span>
                </div>
                <p className="font-bold text-xs">{turn.answer_text}</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
