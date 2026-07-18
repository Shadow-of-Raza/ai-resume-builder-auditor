'use client';

import React, { useEffect, useState } from 'react';
import { ResumeProfile, TailoredResume } from '../../../lib/schemas';

export default function TailoredPrintPage() {
  const [originalResume, setOriginalResume] = useState<ResumeProfile | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedOrig = localStorage.getItem('originalResume');
      const storedTailored = localStorage.getItem('tailoredResume');

      if (!storedOrig || !storedTailored) {
        setError('No tailoring session data found. Please run the tailoring wizard first.');
        return;
      }

      setOriginalResume(JSON.parse(storedOrig));
      setTailoredResume(JSON.parse(storedTailored));
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
      }, 800);
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
            className="px-4 py-2 bg-slate-700 hover:bg-slate-650 rounded-lg text-xs font-semibold"
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
          <span className="text-sm font-semibold tracking-wide text-slate-300">Preparing print layout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 min-h-screen p-8 sm:p-12 font-serif leading-relaxed max-w-[8.5in] mx-auto print:p-0 print:m-0 print:max-w-full print:bg-white print:text-black">
      {/* Print Action Instructions (visible on screen only) */}
      <div className="no-print mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-800">
        <div>
          <span className="font-bold">Print Preview Mode</span> — Use the print dialog to save as PDF. Ensure "Background graphics" is enabled and margins are set to "Default" or "None".
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all cursor-pointer"
          >
            Trigger Print Dialog
          </button>
          <button
            onClick={() => window.close()}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Resume Content Container */}
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase font-sans">
            {originalResume.contact.fullName}
          </h1>
          <div className="text-xs text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-1 font-sans">
            {originalResume.contact.email && <span>{originalResume.contact.email}</span>}
            {originalResume.contact.phone && <span>• {originalResume.contact.phone}</span>}
            {originalResume.contact.location && <span>• {originalResume.contact.location}</span>}
            {originalResume.contact.website && (
              <span>
                • <a href={originalResume.contact.website} className="underline">{originalResume.contact.website.replace(/^https?:\/\//, '')}</a>
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {tailoredResume.tailoredSummary && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Professional Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              {tailoredResume.tailoredSummary}
            </p>
          </div>
        )}

        {/* Skills */}
        {tailoredResume.tailoredSkills && tailoredResume.tailoredSkills.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Core Skills
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {tailoredResume.tailoredSkills.join(', ')}
            </p>
          </div>
        )}

        {/* Experience */}
        {tailoredResume.tailoredExperience && tailoredResume.tailoredExperience.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {tailoredResume.tailoredExperience.map((job, idx) => {
                const origJob = originalResume.experience[idx] || {};
                return (
                  <div key={idx} className="space-y-1.5 print-avoid-break">
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-800 font-sans">
                      <span>
                        {job.company} <span className="font-normal text-slate-500">| {job.title}</span>
                      </span>
                      <span className="font-normal text-slate-500 text-[10px]">
                        {origJob.startDate} – {origJob.endDate}
                      </span>
                    </div>
                    {origJob.location && (
                      <div className="text-[10px] text-slate-500 font-sans">{origJob.location}</div>
                    )}
                    <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 leading-relaxed">
                      {job.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-justify">
                          {b.tailored}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects */}
        {tailoredResume.tailoredProjects && tailoredResume.tailoredProjects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Key Projects
            </h2>
            <div className="space-y-4">
              {tailoredResume.tailoredProjects.map((proj, idx) => {
                const origProj = originalResume.projects?.[idx] || {};
                return (
                  <div key={idx} className="space-y-1.5 print-avoid-break">
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-800 font-sans">
                      <span>{proj.name}</span>
                      {origProj.technologies && origProj.technologies.length > 0 && (
                        <span className="font-normal text-slate-500 text-[10px] italic">
                          ({origProj.technologies.join(', ')})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-sans leading-normal">
                      {proj.description}
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 leading-relaxed">
                      {proj.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-justify">
                          {b.tailored}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Education */}
        {originalResume.education && originalResume.education.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Education
            </h2>
            <div className="space-y-2">
              {originalResume.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-baseline text-xs text-slate-800 font-sans print-avoid-break">
                  <div>
                    <span className="font-bold">{edu.institution}</span>
                    <span className="text-slate-500"> — {edu.degree} in {edu.major}</span>
                    {edu.gpa && <span className="text-slate-500"> (GPA: {edu.gpa})</span>}
                  </div>
                  <span className="text-slate-500 text-[10px]">{edu.graduationDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {originalResume.certifications && originalResume.certifications.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider font-sans">
              Certifications & Credentials
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {originalResume.certifications.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
