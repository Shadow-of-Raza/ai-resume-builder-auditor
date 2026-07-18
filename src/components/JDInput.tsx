'use client';

import React, { useState } from 'react';
import { Briefcase, Link2, Globe, AlertCircle } from 'lucide-react';

interface JDInputProps {
  onTextChange: (text: string) => void;
  rawText: string;
}

export default function JDInput({ onTextChange, rawText }: JDInputProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'url'>('paste');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > 30000) return;
    onTextChange(text);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    if (!url.trim()) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError('Please enter a valid absolute URL (starting with http:// or https://).');
      return;
    }

    // Simulate scraping for the static prototype
    // (In future phases this will hit `/api/analyze-jd` with a URL parameter)
    onTextChange("Scraped contents of " + url + "\nSenior Software Engineer listing...");
  };

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-brand/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand" />
            2. Job Description
          </h2>
          <p className="text-xs text-foreground/50 mt-0.5">Provide the target requirements for matching.</p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex rounded-lg bg-dark-border p-1 text-xs">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'paste' ? 'bg-brand text-foreground' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'url' ? 'bg-brand text-foreground' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Job URL
          </button>
        </div>
      </div>

      {activeTab === 'paste' ? (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={handleTextChange}
              placeholder="Paste the raw text of the target job listing here..."
              className="w-full h-[180px] bg-dark-panel/60 border border-dark-border focus:border-brand/50 focus:outline-none rounded-xl p-4 text-sm font-sans placeholder-foreground/30 resize-none transition-all"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-foreground/30 font-mono">
              {rawText.length.toLocaleString()} / 30,000 characters
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://careers.company.com/jobs/102..."
                className="w-full bg-dark-panel/60 border border-dark-border focus:border-brand/50 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-sans placeholder-foreground/30 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 bg-brand hover:bg-brand/90 text-foreground text-xs rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 shrink-0"
            >
              <Link2 className="w-4 h-4" />
              Import
            </button>
          </form>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-dark-border bg-dark-panel/40 text-foreground/50 text-[11px] leading-relaxed">
            <AlertCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground/75 block mb-0.5">Planned URL Extraction</span>
              In Phase 2, this will send the link to our server-side crawler to extract clean, readable text from major job boards (LinkedIn, Indeed, Lever, Greenhouse, etc.).
            </div>
          </div>

          {urlError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-accent-red/20 bg-accent-red-glow text-accent-red text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{urlError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
