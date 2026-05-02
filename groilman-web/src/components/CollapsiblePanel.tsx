"use client";

import { ReactNode } from "react";

interface CollapsiblePanelProps {
  id: string;
  title: string;
  icon: string;
  expanded: string | null;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export default function CollapsiblePanel({ id, title, icon, expanded, onToggle, children }: CollapsiblePanelProps) {
  const isExpanded = expanded === id;
  
  return (
    <div className={`border border-white/5 rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'flex-1 min-h-[180px]' : 'h-9 shrink-0'}`}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-black/40 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">{icon}</span>
          <span className="text-xs font-bold text-white/70">{title}</span>
        </div>
        <span className={`text-[10px] text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div className={`h-[calc(100%-36px)] overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
        {isExpanded && <div className="h-full">{children}</div>}
      </div>
    </div>
  );
}