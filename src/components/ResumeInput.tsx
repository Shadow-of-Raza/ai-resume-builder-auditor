'use client';

import React, { useState } from 'react';
import { FileText, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ResumeInputProps {
  onTextChange: (text: string) => void;
  rawText: string;
  onFileSelected?: (file: File | null) => void;
}

export default function ResumeInput({ onTextChange, rawText, onFileSelected }: ResumeInputProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<{ name: string; size: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (file: File) => {
    setError(null);
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      setFileMetadata(null);
      onFileSelected?.(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size allowed is 5MB.');
      setFileMetadata(null);
      onFileSelected?.(null);
      return;
    }

    setFileMetadata({
      name: file.name,
      size: formatBytes(file.size),
    });

    onFileSelected?.(file);
    onTextChange(`[File]: ${file.name}`);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > 50000) return;
    onTextChange(text);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-brand/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            1. Your Resume
          </h2>
          <p className="text-xs text-foreground/50 mt-0.5">Upload your current resume or paste its raw contents.</p>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex rounded-lg bg-dark-border p-1 text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'upload' ? 'bg-brand text-foreground' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'paste' ? 'bg-brand text-foreground' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-brand bg-brand-glow'
                : fileMetadata
                ? 'border-accent-green/40 bg-accent-green-glow'
                : 'border-dark-border hover:border-brand/40 bg-dark-panel/40'
            }`}
          >
            <input
              type="file"
              id="resume-file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={onFileChange}
            />
            <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center justify-center">
              {fileMetadata ? (
                <div className="flex flex-col items-center text-center animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-accent-green mb-3" />
                  <p className="text-sm font-semibold text-foreground max-w-[280px] truncate">{fileMetadata.name}</p>
                  <p className="text-xs text-foreground/40 mt-1">{fileMetadata.size} • Ready for parsing</p>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setFileMetadata(null);
                      onFileSelected?.(null);
                      onTextChange('');
                    }}
                    className="text-xs text-brand hover:underline mt-4 cursor-pointer font-medium"
                  >
                    Replace file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-12 h-12 text-foreground/30 mb-3 transition-transform duration-300 group-hover:-translate-y-1" />
                  <p className="text-sm font-medium text-foreground">Drag and drop file here</p>
                  <p className="text-xs text-foreground/40 mt-1.5 mb-4">Accepts PDF, DOCX, and TXT up to 5MB</p>
                  <span className="px-4 py-2 bg-dark-border hover:bg-dark-border/80 border border-dark-border text-xs rounded-lg font-medium transition-colors">
                    Browse files
                  </span>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-accent-red/20 bg-accent-red-glow text-accent-red text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={handleTextChange}
              placeholder="Paste the raw text of your resume here..."
              className="w-full h-[180px] bg-dark-panel/60 border border-dark-border focus:border-brand/50 focus:outline-none rounded-xl p-4 text-sm font-sans placeholder-foreground/30 resize-none transition-all"
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-foreground/30 font-mono">
              {rawText.length.toLocaleString()} / 50,000 characters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
