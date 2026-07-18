'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import ResumeInput from '../components/ResumeInput';
import JDInput from '../components/JDInput';
import ScoreCard from '../components/ScoreCard';
import GapAnalysisView from '../components/GapAnalysisView';
import SideBySideDiff from '../components/SideBySideDiff';
import SkeletonLoader from '../components/SkeletonLoader';
import { ResumeProfile, TailoredResume, JobDescriptionProfile, MatchScore, GapAnalysis } from '../lib/schemas';
import { Download, CheckCircle, FileText, AlertCircle, Sparkles, Printer } from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States populated by our operations
  const [originalResume, setOriginalResume] = useState<ResumeProfile | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionProfile | null>(null);
  const [originalScore, setOriginalScore] = useState<MatchScore | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [tailoredScore, setTailoredScore] = useState<MatchScore | null>(null);

  // Hydrate states from localStorage on client-side mount
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem('currentStep');
      if (savedStep) setCurrentStep(Number(savedStep));

      const savedResumeText = localStorage.getItem('resumeText');
      if (savedResumeText) setResumeText(savedResumeText);

      const savedJdText = localStorage.getItem('jdText');
      if (savedJdText) setJdText(savedJdText);

      const savedOriginalResume = localStorage.getItem('originalResume');
      if (savedOriginalResume) setOriginalResume(JSON.parse(savedOriginalResume));

      const savedJobDescription = localStorage.getItem('jobDescription');
      if (savedJobDescription) setJobDescription(JSON.parse(savedJobDescription));

      const savedOriginalScore = localStorage.getItem('originalScore');
      if (savedOriginalScore) setOriginalScore(JSON.parse(savedOriginalScore));

      const savedGapAnalysis = localStorage.getItem('gapAnalysis');
      if (savedGapAnalysis) setGapAnalysis(JSON.parse(savedGapAnalysis));

      const savedTailoredResume = localStorage.getItem('tailoredResume');
      if (savedTailoredResume) setTailoredResume(JSON.parse(savedTailoredResume));

      const savedTailoredScore = localStorage.getItem('tailoredScore');
      if (savedTailoredScore) setTailoredScore(JSON.parse(savedTailoredScore));
    } catch (e) {
      console.error('Failed to load session from localStorage', e);
    }
  }, []);

  // Save states to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('currentStep', String(currentStep));
      localStorage.setItem('resumeText', resumeText);
      localStorage.setItem('jdText', jdText);
      
      if (originalResume) localStorage.setItem('originalResume', JSON.stringify(originalResume));
      else localStorage.removeItem('originalResume');

      if (jobDescription) localStorage.setItem('jobDescription', JSON.stringify(jobDescription));
      else localStorage.removeItem('jobDescription');

      if (originalScore) localStorage.setItem('originalScore', JSON.stringify(originalScore));
      else localStorage.removeItem('originalScore');

      if (gapAnalysis) localStorage.setItem('gapAnalysis', JSON.stringify(gapAnalysis));
      else localStorage.removeItem('gapAnalysis');

      if (tailoredResume) localStorage.setItem('tailoredResume', JSON.stringify(tailoredResume));
      else localStorage.removeItem('tailoredResume');

      if (tailoredScore) localStorage.setItem('tailoredScore', JSON.stringify(tailoredScore));
      else localStorage.removeItem('tailoredScore');
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  }, [
    currentStep,
    resumeText,
    jdText,
    originalResume,
    jobDescription,
    originalScore,
    gapAnalysis,
    tailoredResume,
    tailoredScore,
  ]);

  const handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    setCurrentStep(1);
    setResumeText('');
    setResumeFile(null);
    setJdText('');
    setOriginalResume(null);
    setJobDescription(null);
    setOriginalScore(null);
    setGapAnalysis(null);
    setTailoredResume(null);
    setTailoredScore(null);
    setErrorMessage(null);
  };

  const handleStepChange = (step: number) => {
    if (step < 1 || step > 4) return;
    setCurrentStep(step);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Prepare resume data
      const resumeForm = new FormData();
      if (resumeFile) {
        resumeForm.append('file', resumeFile);
      } else {
        resumeForm.append('text', resumeText);
      }

      // 2. Prepare JD data
      const isUrl = jdText.trim().startsWith('http://') || jdText.trim().startsWith('https://');
      const jdPayload = isUrl ? { url: jdText.trim() } : { text: jdText };

      // 3. Trigger API calls in parallel
      const [resumeResponse, jdResponse] = await Promise.all([
        fetch('/api/parse-resume', { method: 'POST', body: resumeForm }),
        fetch('/api/analyze-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jdPayload)
        })
      ]);

      const resumeData = await resumeResponse.json();
      const jdData = await jdResponse.json();

      if (!resumeResponse.ok) {
        throw new Error(resumeData.error || 'Failed to parse resume.');
      }
      if (!jdResponse.ok) {
        throw new Error(jdData.error || 'Failed to analyze job description.');
      }

      // 3.5. Fetch scoring and gaps from backend
      const scoreResponse = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalResume: resumeData, jobDescription: jdData })
      });
      const scoreData = await scoreResponse.json();
      if (!scoreResponse.ok) {
        throw new Error(scoreData.error || 'Failed to analyze scoring.');
      }

      // 4. Update state and step
      setOriginalResume(resumeData);
      setJobDescription(jdData);
      setOriginalScore(scoreData.originalScore);
      setGapAnalysis(scoreData.gapAnalysis);
      setCurrentStep(2);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to parse or analyze inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!originalResume || !jobDescription) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalResume, jobDescription })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to tailor resume.');
      }

      setTailoredResume(data.tailoredResume);
      setTailoredScore(data.tailoredScore);
      setCurrentStep(3);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to tailor resume experience.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTailored = (updated: TailoredResume) => {
    setTailoredResume(updated);
  };

  const handleExportTailored = () => {
    if (!originalResume || !tailoredResume) return;
    localStorage.setItem('originalResume', JSON.stringify(originalResume));
    localStorage.setItem('tailoredResume', JSON.stringify(tailoredResume));
    window.open('/print/tailored', '_blank');
  };

  const handleExportComparison = () => {
    if (!originalResume || !tailoredResume) return;
    localStorage.setItem('originalResume', JSON.stringify(originalResume));
    localStorage.setItem('tailoredResume', JSON.stringify(tailoredResume));
    if (jobDescription) localStorage.setItem('jobDescription', JSON.stringify(jobDescription));
    if (originalScore) localStorage.setItem('originalScore', JSON.stringify(originalScore));
    if (tailoredScore) localStorage.setItem('tailoredScore', JSON.stringify(tailoredScore));
    if (gapAnalysis) localStorage.setItem('gapAnalysis', JSON.stringify(gapAnalysis));
    window.open('/print/comparison', '_blank');
  };

  // Determine navigation eligibility and labels
  const canNavigateForward = 
    (currentStep === 1 && resumeText.trim().length > 0 && jdText.trim().length > 0) ||
    (currentStep === 2 && originalResume !== null && originalScore !== null && gapAnalysis !== null) ||
    (currentStep === 3 && tailoredResume !== null && tailoredScore !== null);

  const getActionTrigger = () => {
    if (currentStep === 1) return handleAnalyze;
    if (currentStep === 2) return handleTailor;
    return undefined;
  };

  const getActionText = () => {
    if (currentStep === 1) return 'Analyze Match';
    if (currentStep === 2) return 'Tailor Resume';
    return undefined;
  };

  return (
    <AppLayout
      currentStep={currentStep}
      onStepChange={handleStepChange}
      canNavigateForward={canNavigateForward}
      onActionTrigger={getActionTrigger()}
      actionText={getActionText()}
      isActionLoading={isLoading}
      onReset={handleReset}
    >
      {errorMessage && (
        <div className="glass-panel border-l-4 border-l-accent-red bg-accent-red-glow/10 rounded-2xl p-5 mb-6 flex items-start gap-3.5 animate-fade-in no-print">
          <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-sm text-foreground">Operation Failed</h4>
            <p className="text-xs text-foreground/70 leading-relaxed text-left">
              {errorMessage}
            </p>
            <p className="text-[10px] text-foreground/45 font-medium leading-relaxed text-left">
              Tip: If you uploaded a PDF or Word document that failed to parse, copy-pasting the plain text directly into the inputs on Step 1 will bypass file-reading limits.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type={currentStep === 1 ? 'analysis' : 'tailoring'} />
      ) : (
        <>
          {/* STEP 1: INGESTION SCREEN */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
              <ResumeInput 
                onTextChange={setResumeText} 
                rawText={resumeText} 
                onFileSelected={setResumeFile}
              />
              <JDInput 
                onTextChange={setJdText} 
                rawText={jdText} 
              />
            </div>
          )}

      {/* STEP 2: ANALYSIS RESULTS */}
      {currentStep === 2 && originalResume && (
        <div className="space-y-8 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 flex items-center justify-between border-l-4 border-l-brand">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand block mb-1">Target Role Identified</span>
              <h3 className="font-extrabold text-lg text-foreground">
                {jobDescription?.jobTitle} <span className="text-foreground/40 font-medium">at {jobDescription?.company}</span>
              </h3>
            </div>
            <span className="px-3.5 py-1.5 bg-brand-glow text-brand text-xs font-semibold rounded-xl border border-brand/20">
              Seniority: {jobDescription?.seniorityLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {originalScore && <ScoreCard score={originalScore} title="Original Resume Match Score" />}
            {gapAnalysis && <GapAnalysisView analysis={gapAnalysis} />}
          </div>
        </div>
      )}

      {/* STEP 3: SIDE-BY-SIDE REVIEW */}
      {currentStep === 3 && originalResume && tailoredResume && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <SideBySideDiff
                original={originalResume}
                tailored={tailoredResume}
                onUpdateTailored={handleUpdateTailored}
              />
            </div>
            
            <div className="lg:col-span-4 space-y-8 sticky top-24">
              {tailoredScore && <ScoreCard score={tailoredScore} title="Tailored Match Score" isTailored={true} />}
              
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40">Review Guideline</h4>
                <div className="flex gap-2.5 text-xs text-foreground/60 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <p>
                    Please verify each bullet rewrite. Pay close attention to warnings regarding skills or claims not fully documented in your profile history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: EXPORT OPTIONS */}
      {currentStep === 4 && originalResume && tailoredResume && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="glass-panel rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-green-glow border border-accent-green/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <CheckCircle className="w-8 h-8 text-accent-green" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Tailoring Complete!</h2>
              <p className="text-sm text-foreground/50 max-w-md mx-auto">
                Your resume has been successfully tailored for the <strong>{jobDescription?.jobTitle}</strong> position. Export your final documents below.
              </p>
            </div>

            <div className="p-4 bg-dark-panel/30 border border-dark-border rounded-xl text-left text-xs max-w-md mx-auto flex gap-3 items-start">
              <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <p className="text-foreground/65 leading-relaxed">
                <strong className="text-foreground">ATS Optimization Notice</strong>: The tailored resume uses vector text, standard styling structures, and clean fonts to ensure it parses seamlessly with Applicant Tracking Systems.
              </p>
            </div>

            <div className="p-4 bg-accent-amber-glow/10 border border-accent-amber/35 rounded-xl text-left text-xs max-w-md mx-auto flex gap-3 items-start">
              <AlertCircle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
              <p className="text-foreground/65 leading-relaxed">
                <strong className="text-accent-amber">Disclaimer</strong>: This tailored draft is an optimization tool. While the system operates under strict truthfulness guardrails, you are legally and ethically responsible for the accuracy of your resume. Please manually verify all statements before submission.
              </p>
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
              <button
                onClick={handleExportTailored}
                className="px-5 py-4 bg-brand hover:bg-brand/90 text-foreground text-xs rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.15)] flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Download Tailored Resume
                <span className="text-[10px] text-foreground/50 font-normal">Clean, Single-Column Format</span>
              </button>

              <button
                onClick={handleExportComparison}
                className="px-5 py-4 bg-dark-panel border border-dark-border hover:bg-dark-border/80 text-foreground text-xs rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-5 h-5 text-brand" />
                Download Comparison Proof
                <span className="text-[10px] text-foreground/50 font-normal">Landscape, Side-by-Side PDF</span>
              </button>
            </div>
          </div>

          {/* Inline Visual Preview of Tailored Resume */}
          <div className="glass-panel rounded-2xl p-8 space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/30 border-b border-dark-border pb-3 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-brand" />
              Tailored Resume Draft Preview
            </h3>

            <div className="p-6 bg-white text-slate-800 rounded-xl space-y-6 shadow-xl border border-slate-200 select-none pointer-events-none">
              {/* Header */}
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">{originalResume.contact.fullName}</h4>
                <p className="text-[10px] text-slate-500">
                  {originalResume.contact.email} • {originalResume.contact.phone} • {originalResume.contact.location}
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold text-slate-900 border-b border-slate-300 pb-0.5 uppercase tracking-wide">
                  Professional Summary
                </h5>
                <p className="text-[9px] text-slate-600 leading-relaxed">{tailoredResume.tailoredSummary}</p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold text-slate-900 border-b border-slate-300 pb-0.5 uppercase tracking-wide">
                  Skills
                </h5>
                <p className="text-[9px] text-slate-600 leading-relaxed">
                  {tailoredResume.tailoredSkills.join(', ')}
                </p>
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-900 border-b border-slate-300 pb-0.5 uppercase tracking-wide">
                  Professional Experience
                </h5>
                
                {tailoredResume.tailoredExperience.map((job, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-800">
                      <span>{job.company} — {job.title}</span>
                      <span className="font-normal text-slate-500">{originalResume.experience[idx].startDate} - {originalResume.experience[idx].endDate}</span>
                    </div>
                    <ul className="list-disc pl-4 text-[8.5px] text-slate-600 space-y-1 leading-normal">
                      {job.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b.tailored}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </AppLayout>
  );
}
