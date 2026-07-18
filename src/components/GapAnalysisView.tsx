'use client';

import React from 'react';
import { GapAnalysis } from '../lib/schemas';
import { ShieldAlert, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';

interface GapAnalysisViewProps {
  analysis: GapAnalysis;
}

export default function GapAnalysisView({ analysis }: GapAnalysisViewProps) {
  const getSeverityBadge = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'bg-accent-red-glow text-accent-red border-accent-red/20';
      case 'medium':
        return 'bg-accent-amber-glow text-accent-amber border-accent-amber/20';
      case 'low':
        return 'bg-brand-glow text-brand border-brand/20';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-brand/30">
      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert className="w-5 h-5 text-brand" />
        <h3 className="font-bold text-lg text-foreground">Gap Analysis</h3>
        <span className="ml-auto text-xs text-foreground/40 font-medium">
          {analysis.gaps.length} gaps identified
        </span>
      </div>

      <div className="space-y-4">
        {analysis.gaps.map((gap, idx) => (
          <div
            key={idx}
            className="p-5 border border-dark-border bg-dark-panel/30 hover:bg-dark-panel/50 rounded-xl transition-all duration-200"
          >
            {/* Header: Name and Severity */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                {gap.name}
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${getSeverityBadge(gap.importance)}`}>
                {gap.importance} Importance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-[11px] leading-relaxed">
              <div className="p-3 bg-dark-panel/40 border border-dark-border/40 rounded-lg">
                <span className="font-bold text-foreground/40 block mb-1 uppercase tracking-wider text-[9px]">
                  Job Description Expectation
                </span>
                <p className="text-foreground/75 italic">&ldquo;{gap.jdEvidence}&rdquo;</p>
              </div>
              <div className="p-3 bg-dark-panel/40 border border-dark-border/40 rounded-lg">
                <span className="font-bold text-foreground/40 block mb-1 uppercase tracking-wider text-[9px]">
                  Your Resume Mention
                </span>
                <p className="text-foreground/75 italic">&ldquo;{gap.resumeEvidence}&rdquo;</p>
              </div>
            </div>

            {/* Actionable Advice */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-dark-border/30 border border-dark-border text-xs">
              <ChevronRight className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-foreground/80 block mb-0.5">Recommended Action:</span>
                <p className="text-foreground/60">{gap.suggestedAction}</p>
              </div>
              
              {/* Truthfulness safety badge */}
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-dark-panel/50 border border-dark-border/60 rounded-md">
                {gap.canSafelyAdd ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-green" />
                    <span className="text-[9px] font-bold text-accent-green uppercase tracking-wide">
                      Add Safely
                    </span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 text-accent-amber" />
                    <span className="text-[9px] font-bold text-accent-amber uppercase tracking-wide">
                      Review Needed
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
