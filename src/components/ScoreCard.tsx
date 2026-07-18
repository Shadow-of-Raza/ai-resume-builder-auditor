'use client';

import React from 'react';
import { MatchScore } from '../lib/schemas';
import { Award, CheckCircle, Info, ChevronRight } from 'lucide-react';

interface ScoreCardProps {
  score: MatchScore;
  title: string;
  isTailored?: boolean;
}

export default function ScoreCard({ score, title, isTailored = false }: ScoreCardProps) {
  const radius = 52;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score.overallScore / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-accent-green';
    if (val >= 60) return 'text-accent-amber';
    return 'text-accent-red';
  };

  const getStrokeColorClass = (val: number) => {
    if (val >= 80) return 'stroke-accent-green';
    if (val >= 60) return 'stroke-accent-amber';
    return 'stroke-accent-red';
  };

  // Convert explainable markdown-like content into basic paragraphs/items for mock view
  const renderExplanation = (text: string) => {
    const lines = text.split('\n');
    return (
      <ul className="space-y-3.5">
        {lines.map((line, idx) => {
          if (line.startsWith('* **')) {
            // Extracted bold key
            const boldPart = line.match(/\*\*([^*]+)\*\*/)?.[1] || '';
            const rest = line.split('**')[2] || '';
            return (
              <li key={idx} className="flex gap-2.5 text-xs text-foreground/75 leading-relaxed">
                <ChevronRight className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">{boldPart}</span>
                  {rest}
                </div>
              </li>
            );
          } else if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold tracking-wide uppercase text-foreground/40 mt-4 first:mt-0 mb-2.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          return null;
        })}
      </ul>
    );
  };

  return (
    <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${isTailored ? 'border-brand/40 shadow-[0_0_20px_rgba(37,99,235,0.05)]' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        <Award className={`w-5 h-5 ${isTailored ? 'text-accent-green' : 'text-brand'}`} />
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
        {isTailored && (
          <span className="ml-auto text-[10px] uppercase font-bold tracking-widest bg-accent-green-glow text-accent-green border border-accent-green/20 px-2 py-0.5 rounded-full">
            Tailored
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Circle Progress Gauge */}
        <div className="md:col-span-4 flex flex-col items-center justify-center py-4 border-r border-dark-border/50">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-dark-border"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Foreground Ring */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`${getStrokeColorClass(score.overallScore)} transition-all duration-1000 ease-out`}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(score.overallScore)}`}>
                {score.overallScore}%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mt-0.5">
                Match
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Criteria Scores */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Skills Coverage</span>
              <span>{score.skillCoverageScore}%</span>
            </div>
            <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-1000"
                style={{ width: `${score.skillCoverageScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Responsibility Alignment</span>
              <span>{score.responsibilityAlignmentScore}%</span>
            </div>
            <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-1000"
                style={{ width: `${score.responsibilityAlignmentScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Keyword Score</span>
              <span>{score.keywordScore}%</span>
            </div>
            <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-1000"
                style={{ width: `${score.keywordScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-foreground/75 mb-1.5">
              <span>Seniority Match</span>
              <span>{score.seniorityScore}%</span>
            </div>
            <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-1000"
                style={{ width: `${score.seniorityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explainable Text Summary */}
      <div className="mt-8 pt-6 border-t border-dark-border/50">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-foreground/40 mb-4">
          <Info className="w-4 h-4 text-brand" />
          Explainable Analysis
        </h4>
        <div className="p-4 bg-dark-panel/30 border border-dark-border rounded-xl">
          {renderExplanation(score.explanation)}
        </div>
      </div>

      {/* Critical Missing Requirements */}
      {score.criticalMissingRequirements.length > 0 && (
        <div className="mt-5 p-4 rounded-xl border border-accent-red/20 bg-accent-red-glow">
          <h4 className="text-xs font-bold text-accent-red uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-accent-red" />
            Missing Critical Requirements
          </h4>
          <ul className="list-disc pl-5 text-[11px] text-foreground/70 space-y-1">
            {score.criticalMissingRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
