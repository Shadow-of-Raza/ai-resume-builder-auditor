'use client';

import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Layers, RotateCcw } from 'lucide-react';

interface AppLayoutProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  canNavigateForward: boolean;
  onActionTrigger?: () => void;
  actionText?: string;
  isActionLoading?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}

export default function AppLayout({
  currentStep,
  onStepChange,
  canNavigateForward,
  onActionTrigger,
  actionText,
  isActionLoading = false,
  onReset,
  children,
}: AppLayoutProps) {
  const steps = [
    { number: 1, name: 'Upload & Parse', description: 'Resume & Job description' },
    { number: 2, name: 'Analysis Results', description: 'Scores and gap evaluation' },
    { number: 3, name: 'Compare & Review', description: 'Truthful bullet tailoring' },
    { number: 4, name: 'Export Document', description: 'Download tailored PDFs' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-foreground font-sans relative overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-glow rounded-full filter blur-[120px] pointer-events-none opacity-30 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-green-glow rounded-full filter blur-[120px] pointer-events-none opacity-20 translate-y-1/3" />

      {/* Header */}
      <header className="border-b border-dark-border/80 bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)]">
              <Layers className="w-4.5 h-4.5 text-brand" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Resume Shapeshifter
                <span className="text-[9px] uppercase font-bold tracking-widest bg-brand-glow border border-brand/35 text-brand px-1.5 py-0.5 rounded-md">
                  MVP
                </span>
              </h1>
              <p className="text-[10px] text-foreground/40 font-medium leading-none mt-0.5">
                JD-to-Resume Tailoring Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-foreground/45 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              Truthfulness Guaranteed
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/4 shrink-0">
          <div className="glass-panel rounded-2xl p-5 sticky top-24 space-y-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/30 px-1">
              Progress Timeline
            </h3>
            
            <nav className="space-y-4">
              {steps.map((step) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;
                
                return (
                  <button
                    key={step.number}
                    disabled={step.number > currentStep && !isCompleted}
                    onClick={() => onStepChange(step.number)}
                    className={`w-full flex items-start text-left gap-3.5 p-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-brand/10 border border-brand/20 shadow-[0_0_15px_rgba(37,99,235,0.05)]'
                        : isCompleted
                        ? 'border border-transparent hover:bg-dark-panel/40'
                        : 'opacity-40 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    {/* Circle Indicator */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                        isCompleted
                          ? 'bg-accent-green-glow border-accent-green/35 text-accent-green'
                          : isActive
                          ? 'bg-brand text-foreground border-brand shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                          : 'bg-dark-panel border-dark-border text-foreground/40'
                      }`}
                    >
                      {isCompleted ? '✓' : step.number}
                    </div>

                    <div className="space-y-0.5">
                      <span
                        className={`text-xs font-bold block leading-none ${
                          isActive ? 'text-foreground' : 'text-foreground/75'
                        }`}
                      >
                        {step.name}
                      </span>
                      <span className="text-[10px] text-foreground/40 block leading-tight font-medium">
                        {step.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
            {onReset && (
              <button
                onClick={onReset}
                className="w-full mt-6 py-2 px-4 border border-accent-red/20 hover:border-accent-red/45 bg-accent-red-glow/5 hover:bg-accent-red-glow/20 text-accent-red text-xs rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Session
              </button>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="flex-1 min-h-[450px]">
            {children}
          </div>

          {/* Footer Navigation Toolbar */}
          <div className="flex items-center justify-between p-4 glass-panel rounded-2xl no-print mt-4">
            <button
              onClick={() => onStepChange(currentStep - 1)}
              disabled={currentStep === 1 || isActionLoading}
              className={`px-4 py-2 border border-dark-border bg-dark-panel/30 hover:bg-dark-panel/75 text-xs rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                currentStep === 1 || isActionLoading ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {onActionTrigger && actionText ? (
              <button
                onClick={onActionTrigger}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-foreground text-xs rounded-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionText}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onStepChange(currentStep + 1)}
                disabled={!canNavigateForward}
                className="px-5 py-2.5 bg-brand hover:bg-brand/90 text-foreground text-xs rounded-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
