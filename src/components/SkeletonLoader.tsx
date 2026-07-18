import React from 'react';

interface SkeletonLoaderProps {
  type: 'analysis' | 'tailoring';
}

export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  if (type === 'analysis') {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Top Header Card */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between border-l-4 border-l-brand/30">
          <div className="space-y-2.5 w-1/2">
            <div className="h-2.5 bg-brand-glow rounded-md w-1/4"></div>
            <div className="h-4 bg-dark-border rounded-md w-3/4"></div>
          </div>
          <div className="h-8 bg-dark-border rounded-xl w-24"></div>
        </div>

        {/* Score & Gauge Card Skeleton */}
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-8 border-b border-dark-border/60 pb-6">
            {/* Circular score gauge */}
            <div className="w-28 h-28 rounded-full border-8 border-dark-border flex items-center justify-center relative shrink-0">
              <div className="h-6 bg-dark-border rounded-md w-10"></div>
            </div>
            
            {/* Score description details */}
            <div className="flex-1 space-y-3 w-full">
              <div className="h-5 bg-dark-border rounded-md w-1/3"></div>
              <div className="h-3 bg-dark-border rounded-md w-full"></div>
              <div className="h-3 bg-dark-border rounded-md w-5/6"></div>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-dark-panel/30 border border-dark-border/50 rounded-xl p-4 space-y-3">
                <div className="h-3 bg-dark-border rounded-md w-1/2"></div>
                <div className="h-4 bg-dark-border rounded-md w-1/4"></div>
                <div className="w-full bg-dark-border/40 rounded-full h-1.5">
                  <div className="bg-brand/20 h-1.5 rounded-full w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gap Analysis list skeleton */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
            <div className="h-4 bg-dark-border rounded-md w-1/4"></div>
            <div className="h-3 bg-dark-border rounded-md w-12"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-dark-panel/20 border border-dark-border/40 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="h-4 bg-dark-border rounded-md w-1/3"></div>
                  <div className="h-3 bg-dark-border rounded-md w-2/3"></div>
                </div>
                <div className="h-6 bg-dark-border rounded-xl w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 'tailoring' review state skeleton
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column - comparative editor list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
              <div className="h-4 bg-dark-border rounded-md w-1/4"></div>
              <div className="flex gap-2">
                <div className="h-7 bg-dark-border rounded-lg w-16"></div>
                <div className="h-7 bg-dark-border rounded-lg w-16"></div>
              </div>
            </div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-dark-border/40 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-dark-border rounded-md w-1/4"></div>
                    <div className="h-3 bg-dark-border rounded-md w-full"></div>
                    <div className="h-3 bg-dark-border rounded-md w-5/6"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-brand-glow rounded-md w-1/4"></div>
                    <div className="h-3 bg-dark-border rounded-md w-full"></div>
                    <div className="h-3 bg-dark-border rounded-md w-11/12"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-dark-border/40 pt-3">
                  <div className="h-3 bg-dark-border rounded-md w-1/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-dark-border rounded-lg w-14"></div>
                    <div className="h-6 bg-dark-border rounded-lg w-14"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - side card */}
        <div className="lg:col-span-4 space-y-8">
          {/* Score gauge skeleton */}
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="h-4 bg-dark-border rounded-md w-1/2"></div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-dark-border shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-dark-border rounded-md w-1/3"></div>
                <div className="h-3 bg-dark-border rounded-md w-3/4"></div>
              </div>
            </div>
          </div>
          
          {/* Guide card skeleton */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-dark-border rounded-md w-1/3"></div>
            <div className="h-2.5 bg-dark-border rounded-md w-full"></div>
            <div className="h-2.5 bg-dark-border rounded-md w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
