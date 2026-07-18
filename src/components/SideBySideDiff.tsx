'use client';

import React, { useState } from 'react';
import { TailoredResume, ResumeProfile } from '../lib/schemas';
import { Edit3, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface SideBySideDiffProps {
  original: ResumeProfile;
  tailored: TailoredResume;
  onUpdateTailored: (updated: TailoredResume) => void;
}

export default function SideBySideDiff({ original, tailored, onUpdateTailored }: SideBySideDiffProps) {
  const [approvedBullets, setApprovedBullets] = useState<Record<string, boolean>>({});
  const [rejectedBullets, setRejectedBullets] = useState<Record<string, boolean>>({});
  const [editStates, setEditStates] = useState<Record<string, { isEditing: boolean; text: string }>>({});
  const [focusedRow, setFocusedRow] = useState<string | null>(null);

  const getRowKey = (section: string, entryIdx: number, bulletIdx: number) => {
    return `${section}-${entryIdx}-${bulletIdx}`;
  };

  const handleApprove = (key: string) => {
    setApprovedBullets((prev) => ({ ...prev, [key]: true }));
    setRejectedBullets((prev) => ({ ...prev, [key]: false }));
  };

  const handleReject = (key: string) => {
    setRejectedBullets((prev) => ({ ...prev, [key]: true }));
    setApprovedBullets((prev) => ({ ...prev, [key]: false }));
  };

  const handleReset = (key: string) => {
    setApprovedBullets((prev) => ({ ...prev, [key]: false }));
    setRejectedBullets((prev) => ({ ...prev, [key]: false }));
    setEditStates((prev) => ({
      ...prev,
      [key]: { isEditing: false, text: '' },
    }));
  };

  const startEdit = (key: string, currentText: string) => {
    setEditStates((prev) => ({
      ...prev,
      [key]: { isEditing: true, text: editStates[key]?.text || currentText },
    }));
  };

  const saveEdit = (key: string, companyIdx: number, bulletIdx: number, isProject = false) => {
    const text = editStates[key]?.text || '';
    setEditStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], isEditing: false },
    }));
    handleApprove(key);

    // Update parent state
    const newTailored = { ...tailored };
    if (isProject) {
      newTailored.tailoredProjects[companyIdx].bullets[bulletIdx].tailored = text;
    } else {
      newTailored.tailoredExperience[companyIdx].bullets[bulletIdx].tailored = text;
    }
    onUpdateTailored(newTailored);
  };

  const renderBulletText = (orig: string, tail: string, key: string, isRejected: boolean) => {
    if (isRejected) {
      return <p className="text-xs text-foreground/80 leading-relaxed font-sans">{orig}</p>;
    }

    if (editStates[key]?.isEditing) {
      return (
        <textarea
          value={editStates[key].text}
          onChange={(e) => setEditStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], text: e.target.value },
          }))}
          className="w-full min-h-[60px] bg-dark-panel border border-brand/50 rounded-lg p-2.5 text-xs text-foreground focus:outline-none resize-none font-sans"
        />
      );
    }

    // Dynamic word-level comparative highlight visualization (mock highlight helper)
    // In final version, this can use an exact diff algorithm like diff-match-patch
    // Here we wrap highlighted changes dynamically
    const renderDiff = (o: string, t: string) => {
      const oWords = o.split(' ');
      const tWords = t.split(' ');
      
      return (
        <p className="text-xs text-foreground/90 leading-relaxed font-sans">
          {tWords.map((word, idx) => {
            const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
            const isMatch = oWords.some(ow => ow.toLowerCase().includes(cleanWord.toLowerCase()) && cleanWord.length > 2);
            if (!isMatch && cleanWord.length > 2) {
              return (
                <span key={idx} className="bg-accent-green/15 text-accent-green px-1 py-0.5 rounded font-medium border border-accent-green/10 mr-1 inline-block">
                  {word}
                </span>
              );
            }
            return <span key={idx} className="mr-1">{word}</span>;
          })}
        </p>
      );
    };

    return renderDiff(orig, tail);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Interactive Side-by-Side Review</h2>
          <p className="text-xs text-foreground/50 mt-1">
            Compare original text with tailored rewrites. Accept, reject, or edit individual changes.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-panel border border-dark-border rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-green/20 border border-accent-green text-accent-green flex items-center justify-center text-[8px] font-bold">✓</span>
            <span>Approved: {Object.values(approvedBullets).filter(Boolean).length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-panel border border-dark-border rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-red/20 border border-accent-red text-accent-red flex items-center justify-center text-[8px] font-bold">✗</span>
            <span>Rejected: {Object.values(rejectedBullets).filter(Boolean).length}</span>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="space-y-8">
        {/* Work Experience Section */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-bold text-base text-foreground border-b border-dark-border pb-3 mb-6 uppercase tracking-wider text-foreground/60">
            Work Experience
          </h3>

          <div className="space-y-8">
            {tailored.tailoredExperience.map((job, jobIdx) => {
              const origJob = original.experience[jobIdx];
              return (
                <div key={jobIdx} className="space-y-4">
                  <div className="flex justify-between items-baseline border-b border-dark-border/40 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{job.company}</h4>
                      <p className="text-xs text-foreground/50 mt-0.5">{job.title}</p>
                    </div>
                    <span className="text-[10px] font-mono text-foreground/40">{origJob.startDate} — {origJob.endDate}</span>
                  </div>

                  {/* Bullet comparisons */}
                  <div className="space-y-3">
                    {job.bullets.map((bullet, bulletIdx) => {
                      const key = getRowKey('exp', jobIdx, bulletIdx);
                      const isApproved = approvedBullets[key];
                      const isRejected = rejectedBullets[key];
                      const isEditing = editStates[key]?.isEditing;
                      const isFocused = focusedRow === key;

                      return (
                        <div
                          key={bulletIdx}
                          onClick={() => setFocusedRow(isFocused ? null : key)}
                          className={`border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                            isFocused
                              ? 'border-brand/40 bg-brand-glow/5'
                              : isApproved
                              ? 'border-accent-green/20 bg-accent-green-glow/5'
                              : isRejected
                              ? 'border-dark-border/50 bg-dark-panel/10 opacity-70'
                              : 'border-dark-border hover:border-dark-border/80 bg-dark-panel/20'
                          }`}
                        >
                          {/* Main Row Content */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dark-border">
                            {/* Left Column: Original */}
                            <div className="p-4 flex gap-3">
                              <span className="text-[10px] font-bold text-foreground/30 font-mono shrink-0 mt-0.5">ORIG</span>
                              <p className="text-xs text-foreground/60 leading-relaxed font-sans">{bullet.original}</p>
                            </div>

                            {/* Right Column: Tailored */}
                            <div className="p-4 flex flex-col justify-between gap-4">
                              <div className="flex gap-3">
                                <span className={`text-[10px] font-bold font-mono shrink-0 mt-0.5 ${isRejected ? 'text-foreground/30' : 'text-brand'}`}>
                                  {isRejected ? 'ORIG' : 'TAILOR'}
                                </span>
                                <div className="flex-1">
                                  {renderBulletText(bullet.original, bullet.tailored, key, isRejected)}
                                </div>
                              </div>

                              {/* Tool Actions */}
                              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-dark-border/30 no-print" onClick={(e) => e.stopPropagation()}>
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(key, jobIdx, bulletIdx, false)}
                                      className="px-2.5 py-1 bg-accent-green hover:bg-accent-green/90 text-[10px] rounded-md font-bold text-background transition-colors flex items-center gap-1"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => handleReset(key)}
                                      className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleApprove(key)}
                                      className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${
                                        isApproved
                                          ? 'bg-accent-green text-background'
                                          : 'bg-dark-border hover:bg-dark-border/80 text-foreground/60 hover:text-foreground'
                                      }`}
                                    >
                                      {isApproved ? 'Approved ✓' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleReject(key)}
                                      className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${
                                        isRejected
                                          ? 'bg-accent-red text-foreground'
                                          : 'bg-dark-border hover:bg-dark-border/80 text-foreground/60 hover:text-foreground'
                                      }`}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => startEdit(key, bullet.tailored)}
                                      className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                                      title="Edit bullet"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {(isApproved || isRejected || editStates[key]) && (
                                      <button
                                        onClick={() => handleReset(key)}
                                        className="p-1 text-foreground/45 hover:text-accent-red rounded transition-colors"
                                        title="Reset"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Metadata Drawer */}
                          {isFocused && (
                            <div className="border-t border-dark-border p-4 bg-dark-panel/40 space-y-3.5 text-xs animate-slide-down">
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-1">
                                  <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider">Change Strategy</span>
                                  <p className="text-foreground/75 leading-relaxed">{bullet.changeReason}</p>
                                </div>
                                <div className="md:w-1/3 space-y-2.5">
                                  <div className="space-y-1">
                                    <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider block">Target Keywords</span>
                                    <div className="flex flex-wrap gap-1">
                                      {bullet.keywordsAddressed.map((kw, kwIdx) => (
                                        <span key={kwIdx} className="bg-brand-glow text-brand border border-brand/20 px-2 py-0.5 rounded-md text-[9px] font-semibold">
                                          {kw}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider block">Confidence Rating</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      bullet.confidence === 'high'
                                        ? 'bg-accent-green-glow text-accent-green'
                                        : bullet.confidence === 'medium'
                                        ? 'bg-accent-amber-glow text-accent-amber'
                                        : 'bg-accent-red-glow text-accent-red'
                                    }`}>
                                      {bullet.confidence}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {bullet.riskFlag && (
                                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-accent-amber/25 bg-accent-amber-glow text-accent-amber text-[11px] leading-relaxed">
                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold block mb-0.5">Verification Warning:</span>
                                    {bullet.riskFlag}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        {tailored.tailoredProjects && tailored.tailoredProjects.length > 0 && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-bold text-base text-foreground border-b border-dark-border pb-3 mb-6 uppercase tracking-wider text-foreground/60">
              Projects
            </h3>

            <div className="space-y-6">
              {tailored.tailoredProjects.map((project, projIdx) => {
                return (
                  <div key={projIdx} className="space-y-4">
                    <div className="border-b border-dark-border/40 pb-2">
                      <h4 className="font-bold text-sm text-foreground">{project.name}</h4>
                      <p className="text-xs text-foreground/50 mt-0.5">{project.description}</p>
                    </div>

                    <div className="space-y-3">
                      {project.bullets.map((bullet, bulletIdx) => {
                        const key = getRowKey('proj', projIdx, bulletIdx);
                        const isApproved = approvedBullets[key];
                        const isRejected = rejectedBullets[key];
                        const isEditing = editStates[key]?.isEditing;
                        const isFocused = focusedRow === key;

                        return (
                          <div
                            key={bulletIdx}
                            onClick={() => setFocusedRow(isFocused ? null : key)}
                            className={`border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                              isFocused
                                ? 'border-brand/40 bg-brand-glow/5'
                                : isApproved
                                ? 'border-accent-green/20 bg-accent-green-glow/5'
                                : isRejected
                                ? 'border-dark-border/50 bg-dark-panel/10 opacity-70'
                                : 'border-dark-border hover:border-dark-border/80 bg-dark-panel/20'
                            }`}
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dark-border">
                              {/* Left Column: Original */}
                              <div className="p-4 flex gap-3">
                                <span className="text-[10px] font-bold text-foreground/30 font-mono shrink-0 mt-0.5">ORIG</span>
                                <p className="text-xs text-foreground/60 leading-relaxed font-sans">{bullet.original}</p>
                              </div>

                              {/* Right Column: Tailored */}
                              <div className="p-4 flex flex-col justify-between gap-4">
                                <div className="flex gap-3">
                                  <span className={`text-[10px] font-bold font-mono shrink-0 mt-0.5 ${isRejected ? 'text-foreground/30' : 'text-brand'}`}>
                                    {isRejected ? 'ORIG' : 'TAILOR'}
                                  </span>
                                  <div className="flex-1">
                                    {renderBulletText(bullet.original, bullet.tailored, key, isRejected)}
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-dark-border/30 no-print" onClick={(e) => e.stopPropagation()}>
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(key, projIdx, bulletIdx, true)}
                                        className="px-2.5 py-1 bg-accent-green hover:bg-accent-green/90 text-[10px] rounded-md font-bold text-background transition-colors flex items-center gap-1"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => handleReset(key)}
                                        className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleApprove(key)}
                                        className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${
                                          isApproved
                                            ? 'bg-accent-green text-background'
                                            : 'bg-dark-border hover:bg-dark-border/80 text-foreground/60 hover:text-foreground'
                                        }`}
                                      >
                                        {isApproved ? 'Approved ✓' : 'Approve'}
                                      </button>
                                      <button
                                        onClick={() => handleReject(key)}
                                        className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${
                                          isRejected
                                            ? 'bg-accent-red text-foreground'
                                            : 'bg-dark-border hover:bg-dark-border/80 text-foreground/60 hover:text-foreground'
                                        }`}
                                      >
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => startEdit(key, bullet.tailored)}
                                        className="p-1 text-foreground/40 hover:text-foreground rounded transition-colors"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      {(isApproved || isRejected || editStates[key]) && (
                                        <button
                                          onClick={() => handleReset(key)}
                                          className="p-1 text-foreground/45 hover:text-accent-red rounded transition-colors"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isFocused && (
                              <div className="border-t border-dark-border p-4 bg-dark-panel/40 space-y-3.5 text-xs">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="flex-1 space-y-1">
                                    <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider">Change Strategy</span>
                                    <p className="text-foreground/75 leading-relaxed">{bullet.changeReason}</p>
                                  </div>
                                  <div className="md:w-1/3 space-y-2.5">
                                    <div className="space-y-1">
                                      <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider block">Target Keywords</span>
                                      <div className="flex flex-wrap gap-1">
                                        {bullet.keywordsAddressed.map((kw, kwIdx) => (
                                          <span key={kwIdx} className="bg-brand-glow text-brand border border-brand/20 px-2 py-0.5 rounded-md text-[9px] font-semibold">
                                            {kw}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-[10px] text-foreground/40 uppercase tracking-wider block">Confidence Rating</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                        bullet.confidence === 'high'
                                          ? 'bg-accent-green-glow text-accent-green'
                                          : bullet.confidence === 'medium'
                                          ? 'bg-accent-amber-glow text-accent-amber'
                                          : 'bg-accent-red-glow text-accent-red'
                                      }`}>
                                        {bullet.confidence}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
