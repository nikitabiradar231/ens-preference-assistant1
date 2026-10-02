'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Globe,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Terminal,
  BookOpen,
  Code2,
} from 'lucide-react';
import { ValidatedPreferences, DEFAULT_PREFERENCES } from '@/validation/preferences';

export default function HomePage() {
  // Input states
  const [ensInput, setEnsInput] = useState<string>('alice-pref.sepolia.eth');
  const [questionInput, setQuestionInput] = useState<string>('Explain what blockchain is.');

  // ENS Resolution states
  const [isLoadingEns, setIsLoadingEns] = useState<boolean>(false);
  const [ensError, setEnsError] = useState<string | null>(null);
  const [normalizedEns, setNormalizedEns] = useState<string | null>(null);
  const [rawRecords, setRawRecords] = useState<Record<string, string | null> | null>(null);
  const [validatedPrefs, setValidatedPrefs] = useState<ValidatedPreferences | null>(null);
  const [appliedInstructions, setAppliedInstructions] = useState<Record<string, string> | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isMockProfile, setIsMockProfile] = useState<boolean>(false);

  // Chat Execution states
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<{ model: string; timeMs: number; isMocked?: boolean } | null>(null);

  // Toggle detail view
  const [showSecurityDetails, setShowSecurityDetails] = useState<boolean>(false);

  // Helper to load ENS preferences
  const handleLoadPreferences = async (overrideName?: string) => {
    const targetName = overrideName || ensInput;
    if (!targetName.trim()) {
      setEnsError('Please enter an ENS name.');
      return;
    }

    setIsLoadingEns(true);
    setEnsError(null);
    setAssistantReply(null);
    setChatError(null);

    try {
      const res = await fetch(`/api/ens?name=${encodeURIComponent(targetName.trim())}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load ENS preferences.');
      }

      setNormalizedEns(data.normalizedEnsName);
      setRawRecords(data.rawRecords);
      setValidatedPrefs(data.validatedPreferences);
      setAppliedInstructions(data.appliedInstructions);
      setSystemPrompt(data.systemPrompt);
      setIsMockProfile(data.isMockProfile);
    } catch (err: any) {
      setEnsError(err.message || 'Error resolving ENS name.');
    } finally {
      setIsLoadingEns(false);
    }
  };

  // Helper to send question to AI assistant
  const handleAskQuestion = async () => {
    if (!questionInput.trim()) {
      setChatError('Please enter a question to ask.');
      return;
    }

    setIsAsking(true);
    setChatError(null);
    setAssistantReply(null);
    setModelInfo(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionInput.trim(),
          rawPreferences: rawRecords || {},
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate AI response.');
      }

      setAssistantReply(data.answer);
      setModelInfo({
        model: data.modelUsed,
        timeMs: data.executionTimeMs,
        isMocked: data.isMocked,
      });
    } catch (err: any) {
      setChatError(err.message || 'Error executing request.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <header className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-indigo-500/20">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <span className="badge badge-indigo">Sepolia Testnet</span>
            <span className="badge badge-emerald flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Safe Application Mapping
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ENS Preference Assistant
          </h1>
          <p className="text-gray-400 text-sm md:text-base mt-1 max-w-2xl">
            Stop explaining yourself. Read validated, portable accessibility and style preferences directly from your ENS name on Sepolia.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Raw ENS records are strictly validated & never interpolated directly into prompts.</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: ENS Resolution & Preferences (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: ENS Input & Profile Selection */}
          <section className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                1. Enter Sepolia ENS Name
              </h2>
              <span className="text-xs text-gray-400">ENSIP-15 Normalized</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                ENS Name Input
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ensInput}
                  onChange={(e) => setEnsInput(e.target.value)}
                  placeholder="e.g. alice-pref.sepolia.eth"
                  className="input-field mono-text"
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadPreferences()}
                />
                <button
                  onClick={() => handleLoadPreferences()}
                  disabled={isLoadingEns}
                  className="btn-primary shrink-0"
                >
                  {isLoadingEns ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Load
                </button>
              </div>

              {/* Error Alert */}
              {ensError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ensError}</span>
                </div>
              )}
            </div>

            {/* Quick Test Profiles */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Quick Test Profiles:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEnsInput('alice-pref.sepolia.eth');
                    handleLoadPreferences('alice-pref.sepolia.eth');
                  }}
                  className="btn-outline text-xs"
                >
                  Profile A (Portuguese, Short)
                </button>
                <button
                  onClick={() => {
                    setEnsInput('bob-pref.sepolia.eth');
                    handleLoadPreferences('bob-pref.sepolia.eth');
                  }}
                  className="btn-outline text-xs"
                >
                  Profile B (English, Medium)
                </button>
                <button
                  onClick={() => {
                    setEnsInput('charlie-malicious.sepolia.eth');
                    handleLoadPreferences('charlie-malicious.sepolia.eth');
                  }}
                  className="btn-outline text-xs text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                >
                  Security Test (Malicious ENS)
                </button>
              </div>
            </div>
          </section>

          {/* Card 2: Detected Preference Summary */}
          <section className="glass-panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                2. Detected Preferences
              </h2>
              {isMockProfile && (
                <span className="badge badge-amber text-[10px]">Test Profile</span>
              )}
            </div>

            {normalizedEns ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                  <div className="text-xs text-gray-400">Normalized Name (ENSIP-15):</div>
                  <div className="text-sm font-semibold text-indigo-300 mono-text">
                    {normalizedEns}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-1">
                    <div className="text-xs text-gray-400">Language</div>
                    <div className="font-semibold text-white capitalize text-sm">
                      {validatedPrefs?.language}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-1">
                    <div className="text-xs text-gray-400">Answer Length</div>
                    <div className="font-semibold text-white capitalize text-sm">
                      {validatedPrefs?.answerLength}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-1">
                    <div className="text-xs text-gray-400">Reading Level</div>
                    <div className="font-semibold text-white capitalize text-sm">
                      {validatedPrefs?.readingLevel}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-1">
                    <div className="text-xs text-gray-400">Sentence Style</div>
                    <div className="font-semibold text-white capitalize text-sm">
                      {validatedPrefs?.sentenceStyle?.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="col-span-2 p-3 rounded-lg bg-slate-900/40 border border-white/5 space-y-1">
                    <div className="text-xs text-gray-400">Topic Avoidance</div>
                    <div className="font-semibold text-white capitalize text-sm">
                      {validatedPrefs?.topicAvoidance}
                    </div>
                  </div>
                </div>

                {/* System Instructions Inspection Dropdown */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {showSecurityDetails ? 'Hide System Prompt Details' : 'Inspect Safe System Instructions'}
                  </button>

                  {showSecurityDetails && systemPrompt && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-indigo-500/20 text-xs space-y-2">
                      <div className="text-gray-400 font-semibold flex items-center justify-between">
                        <span>Application-Authored Prompt:</span>
                        <span className="text-[10px] text-emerald-400">0% Raw ENS Interpolation</span>
                      </div>
                      <pre className="text-indigo-200 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                        {systemPrompt}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm space-y-2">
                <Globe className="w-8 h-8 mx-auto opacity-30" />
                <p>Click "Load" to fetch and validate Sepolia ENS preferences.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: AI Assistant Chat Interface (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 3: Question Input & Assistant Response */}
          <section className="glass-panel p-6 md:p-8 space-y-6 flex flex-col justify-between min-h-[520px]">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  3. Personalised AI Assistant
                </h2>
                {modelInfo && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-indigo text-[10px]">{modelInfo.model}</span>
                    <span className="text-xs text-gray-400">{modelInfo.timeMs}ms</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Select or Type Question
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setQuestionInput('Explain what blockchain is.')}
                    className="btn-outline text-xs"
                  >
                    "Explain what blockchain is."
                  </button>
                  <button
                    onClick={() => setQuestionInput('What is quantum computing?')}
                    className="btn-outline text-xs"
                  >
                    "What is quantum computing?"
                  </button>
                  <button
                    onClick={() => setQuestionInput('Give me political analysis on current events.')}
                    className="btn-outline text-xs"
                  >
                    "Give me political analysis."
                  </button>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Ask any question..."
                  className="input-field resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleAskQuestion}
                    disabled={isAsking}
                    className="btn-primary w-full md:w-auto"
                  >
                    {isAsking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Response...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Ask Personalized Assistant
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chat Error Banner */}
              {chatError && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Execution Error</div>
                    <div className="text-xs mt-1 text-rose-200">{chatError}</div>
                  </div>
                </div>
              )}

              {/* Assistant Response Box */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Assistant Response
                  </label>
                  {validatedPrefs && (
                    <span className="text-xs text-indigo-300">
                      Applied Style: {validatedPrefs.language} / {validatedPrefs.answerLength} / {validatedPrefs.readingLevel}
                    </span>
                  )}
                </div>

                <div className="p-5 rounded-xl bg-slate-950/80 border border-indigo-500/20 min-h-[160px] text-gray-200 text-sm leading-relaxed relative">
                  {isAsking ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 rounded-xl">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-xs text-gray-400 pulse-glow">
                        Applying validated Sepolia ENS preferences...
                      </p>
                    </div>
                  ) : assistantReply ? (
                    <div className="whitespace-pre-wrap">{assistantReply}</div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic py-10">
                      Response will appear here after clicking "Ask Personalized Assistant".
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ENSIP-15 Normalized • Zod Allowlisted
              </span>
              <span>Explicit Timeout: 15,000ms</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
