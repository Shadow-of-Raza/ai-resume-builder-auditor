'use client';

import React, { useEffect, useState } from 'react';
import { ResumeProfile, TailoredResume, JobDescriptionProfile, MatchScore, GapAnalysis } from '../../../lib/schemas';

export default function ComparisonPrintPage() {
  const [originalResume, setOriginalResume] = useState<ResumeProfile | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionProfile | null>(null);
  const [originalScore, setOriginalScore] = useState<MatchScore | null>(null);
  const [tailoredScore, setTailoredScore] = useState<MatchScore | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedOrig = localStorage.getItem('originalResume');
      const storedTailored = localStorage.getItem('tailoredResume');
      const storedJd = localStorage.getItem('jobDescription');
      const storedOrigScore = localStorage.getItem('originalScore');
      const storedTailoredScore = localStorage.getItem('tailoredScore');
      const storedGaps = localStorage.getItem('gapAnalysis');

      if (!storedOrig || !storedTailored) {
        setError('No tailoring session data found. Please run the tailoring wizard first.');
        return;
      }

      setOriginalResume(JSON.parse(storedOrig));
      setTailoredResume(JSON.parse(storedTailored));
      if (storedJd) setJobDescription(JSON.parse(storedJd));
      if (storedOrigScore) setOriginalScore(JSON.parse(storedOrigScore));
      if (storedTailoredScore) setTailoredScore(JSON.parse(storedTailoredScore));
      if (storedGaps) setGapAnalysis(JSON.parse(storedGaps));
    } catch (err) {
      console.error(err);
      setError('Failed to load session data.');
    }
  }, []);

  // Automatically trigger print once component has loaded data
  useEffect(() => {
    if (originalResume && tailoredResume) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [originalResume, tailoredResume]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
          <h1 className="text-xl font-bold text-red-400">Print Error</h1>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-700 rounded-lg text-xs font-semibold"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  if (!originalResume || !tailoredResume) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wide text-slate-300">Preparing comparison proof report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 min-h-screen p-8 sm:p-12 font-sans max-w-[11in] mx-auto print:p-0 print:m-0 print:max-w-full print:bg-white print:text-black">
      {/* Print Action Instructions (visible on screen only) */}
      <div className="no-print mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
        <div>
          <span className="font-bold">Proof Comparison Print Mode</span> — Best printed in **Landscape** layout. Use the print dialog to save as PDF.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
          >
            Trigger Print Dialog
          </button>
          <button
            onClick={() => window.close()}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Resume Tailoring Proof Report
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Applicant: {originalResume.contact.fullName}
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            Generated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Roles Details Card */}
        {jobDescription && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Target Position</span>
              <span className="font-bold text-sm text-slate-800">
                {jobDescription.jobTitle} <span className="font-normal text-slate-500">at {jobDescription.company || 'Unknown Company'}</span>
              </span>
            </div>
            <div className="flex md:justify-end gap-6">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Seniority Level</span>
                <span className="font-bold text-xs text-slate-800">{jobDescription.seniorityLevel}</span>
              </div>
              {jobDescription.domainSignals && jobDescription.domainSignals.length > 0 && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Domain signals</span>
                  <span className="font-bold text-xs text-slate-800">{jobDescription.domainSignals.slice(0, 3).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scores Grid */}
        {originalScore && tailoredScore && (
          <div className="space-y-3 print-avoid-break">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Match Scoring Matrix</h2>
            <table className="w-full text-left border-collapse text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2.5 font-bold text-slate-600">Metric Category</th>
                  <th className="p-2.5 font-bold text-center text-slate-600 w-28">Original Resume</th>
                  <th className="p-2.5 font-bold text-center text-slate-600 w-28">Tailored Resume</th>
                  <th className="p-2.5 font-bold text-center text-slate-600 w-28">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                <tr>
                  <td className="p-2.5 font-bold text-slate-800">Overall Score</td>
                  <td className="p-2.5 text-center font-bold text-slate-500">{originalScore.overallScore}%</td>
                  <td className="p-2.5 text-center font-bold text-emerald-600 bg-emerald-50/50">{tailoredScore.overallScore}%</td>
                  <td className="p-2.5 text-center font-bold text-emerald-600 font-mono">
                    +{tailoredScore.overallScore - originalScore.overallScore}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-700">Skill Coverage Score</td>
                  <td className="p-2.5 text-center text-slate-500">{originalScore.skillCoverageScore}%</td>
                  <td className="p-2.5 text-center text-emerald-600">{tailoredScore.skillCoverageScore}%</td>
                  <td className="p-2.5 text-center font-mono">
                    {tailoredScore.skillCoverageScore >= originalScore.skillCoverageScore ? '+' : ''}
                    {tailoredScore.skillCoverageScore - originalScore.skillCoverageScore}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-700">Responsibility Alignment Score</td>
                  <td className="p-2.5 text-center text-slate-500">{originalScore.responsibilityAlignmentScore}%</td>
                  <td className="p-2.5 text-center text-emerald-600">{tailoredScore.responsibilityAlignmentScore}%</td>
                  <td className="p-2.5 text-center font-mono">
                    {tailoredScore.responsibilityAlignmentScore >= originalScore.responsibilityAlignmentScore ? '+' : ''}
                    {tailoredScore.responsibilityAlignmentScore - originalScore.responsibilityAlignmentScore}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-700">Keyword Score</td>
                  <td className="p-2.5 text-center text-slate-500">{originalScore.keywordScore}%</td>
                  <td className="p-2.5 text-center text-emerald-600">{tailoredScore.keywordScore}%</td>
                  <td className="p-2.5 text-center font-mono">
                    {tailoredScore.keywordScore >= originalScore.keywordScore ? '+' : ''}
                    {tailoredScore.keywordScore - originalScore.keywordScore}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-700">Seniority Match Score</td>
                  <td className="p-2.5 text-center text-slate-500">{originalScore.seniorityScore}%</td>
                  <td className="p-2.5 text-center text-emerald-600">{tailoredScore.seniorityScore}%</td>
                  <td className="p-2.5 text-center font-mono">
                    {tailoredScore.seniorityScore >= originalScore.seniorityScore ? '+' : ''}
                    {tailoredScore.seniorityScore - originalScore.seniorityScore}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Gap Analysis List */}
        {gapAnalysis && gapAnalysis.gaps && gapAnalysis.gaps.length > 0 && (
          <div className="space-y-3 print-avoid-break">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Identified Gaps & Actions</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {gapAnalysis.gaps.map((gap, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{gap.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      gap.importance === 'high'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : gap.importance === 'medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Importance: {gap.importance}
                    </span>
                  </div>
                  <div className="text-slate-600 leading-normal">
                    <strong>JD Requirement:</strong> "{gap.jdEvidence}"
                  </div>
                  <div className="text-slate-600 leading-normal">
                    <strong>Recommendation:</strong> {gap.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bullet-by-Bullet Comparative Diffs */}
        <div className="space-y-4 print-page-break">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Experience Comparative Log</h2>
          <div className="space-y-6">
            {tailoredResume.tailoredExperience.map((job, jobIdx) => {
              const origJob = originalResume.experience[jobIdx] || {};
              return (
                <div key={jobIdx} className="space-y-3 print-avoid-break">
                  <div className="border-b border-slate-300 pb-1 flex justify-between items-baseline font-bold text-slate-800 text-xs">
                    <span>{job.company} — {job.title}</span>
                    <span className="font-normal text-slate-500 text-[10px]">{origJob.startDate} – {origJob.endDate}</span>
                  </div>

                  <table className="w-full text-xs border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-2 font-bold text-slate-500 text-left w-1/2">Original Bullet</th>
                        <th className="p-2 font-bold text-slate-500 text-left w-1/2">Tailored Rewrite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {job.bullets.map((b, bIdx) => {
                        // Highlight new keywords in tailored bullet
                        const origWords = b.original.split(' ');
                        const words = b.tailored.split(' ');
                        const highlightedTailored = words.map((w, wIdx) => {
                          const cleanW = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                          const isMatch = origWords.some(ow => ow.toLowerCase().includes(cleanW.toLowerCase()) && cleanW.length > 2);
                          if (!isMatch && cleanW.length > 2) {
                            return (
                              <span key={wIdx} className="bg-emerald-50 text-emerald-700 px-0.5 rounded font-semibold border border-emerald-100 mr-1 inline-block">
                                {w}
                              </span>
                            );
                          }
                          return <span key={wIdx} className="mr-1">{w}</span>;
                        });

                        return (
                          <tr key={bIdx}>
                            <td className="p-2.5 text-slate-500 leading-relaxed text-justify">
                              {b.original}
                            </td>
                            <td className="p-2.5 text-slate-800 leading-relaxed text-justify bg-emerald-50/10">
                              {highlightedTailored}
                              {b.riskFlag && (
                                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100 font-mono">
                                  <strong>Verification Alert:</strong> {b.riskFlag}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
