'use client';

import React, { useState, useEffect } from 'react';
import { CodingChallenge, TestCase } from '@/types/interview';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Terminal, 
  Code2, 
  Sparkles, 
  HelpCircle, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Layers,
  Zap,
  Check
} from 'lucide-react';

interface CodeEditorProps {
  challenge: CodingChallenge;
  onCodeChange: (code: string, passPercentage: number) => void;
  initialCode?: string;
}

interface TestResultItem {
  testCase: TestCase;
  actualOutput: string;
  expectedOutput: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export default function CodeEditor({ challenge, onCodeChange, initialCode }: CodeEditorProps) {
  const [code, setCode] = useState<string>(initialCode || challenge.starterCode);
  const [activeTab, setActiveTab] = useState<'editor' | 'testcases' | 'console'>('testcases');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runningStep, setRunningStep] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIndex, setActiveHintIndex] = useState<number>(0);
  const [expandedCaseIndex, setExpandedCaseIndex] = useState<number | null>(0);
  const [totalExecutionTimeMs, setTotalExecutionTimeMs] = useState<number>(0);

  // Auto-run starter code once on mount to show initial test case state
  useEffect(() => {
    executeCode(false);
  }, []);

  /**
   * Safe, resilient in-browser multi-statement JavaScript code runner
   */
  const executeCode = async (focusTab: boolean = true) => {
    setIsRunning(true);
    setRunningStep('Initializing runtime environment...');
    if (focusTab) setActiveTab('testcases');

    const logs: string[] = [];
    const results: TestResultItem[] = [];

    const nowStr = () => new Date().toISOString().split('T')[1].slice(0, 12);

    const customConsole = {
      log: (...args: any[]) => {
        const formatted = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logs.push(`[${nowStr()}] ${formatted}`);
      },
      error: (...args: any[]) => {
        const formatted = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logs.push(`[${nowStr()}] [ERROR] ${formatted}`);
      },
      warn: (...args: any[]) => {
        const formatted = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logs.push(`[${nowStr()}] [WARN] ${formatted}`);
      },
    };

    const overallStartTime = performance.now();

    // Visual Step 1
    await new Promise((r) => setTimeout(r, 120));
    setRunningStep('Compiling code & binding scope...');

    try {
      for (let i = 0; i < challenge.testCases.length; i++) {
        const tc = challenge.testCases[i];
        setRunningStep(`Executing Test Case ${i + 1} of ${challenge.testCases.length}...`);
        await new Promise((r) => setTimeout(r, 80));

        const caseStartTime = performance.now();
        let passed = false;
        let actualOutput = '';
        let errorMsg: string | undefined = undefined;

        try {
          // Parse test input code safely:
          // If input has multiple statements (semicolons, const/let/var), transform last statement to return
          let transformedInput = tc.input.trim();
          if (!transformedInput.startsWith('return ') && !transformedInput.includes('return ')) {
            if (transformedInput.includes(';')) {
              // Replace last statement with return
              transformedInput = transformedInput.replace(/;?\s*([^;]+)$/, '; return ($1);');
            } else {
              transformedInput = `return (${transformedInput});`;
            }
          }

          // Build isolated Function runner with mocked CommonJS environment
          const runnerFn = new Function(
            'console',
            `
            let module = { exports: {} };
            let exports = module.exports;

            ${code}

            // If class/function was exported to module.exports, ensure availability
            if (typeof module.exports === 'function') {
              var CacheManager = module.exports;
              var RateLimiter = module.exports;
              var OfflineQueue = module.exports;
            }

            function __executeTestCase() {
              ${transformedInput}
            }

            return __executeTestCase();
            `
          );

          const res = runnerFn(customConsole);
          const resolvedRes = res instanceof Promise ? await res : res;
          const caseEndTime = performance.now();

          if (typeof resolvedRes === 'object' && resolvedRes !== null) {
            actualOutput = JSON.stringify(resolvedRes);
          } else {
            actualOutput = String(resolvedRes);
          }

          // Normalize strings (remove outer whitespace and spacing differences in JSON)
          const normActual = actualOutput.replace(/\s+/g, '').replace(/":/g, '": ');
          const normExpected = tc.expectedOutput.replace(/\s+/g, '').replace(/":/g, '": ');
          const rawEqual = actualOutput.trim() === tc.expectedOutput.trim();
          const cleanEqual = actualOutput.replace(/\s+/g, '') === tc.expectedOutput.replace(/\s+/g, '');

          passed = rawEqual || cleanEqual || normActual === normExpected;

          results.push({
            testCase: tc,
            actualOutput,
            expectedOutput: tc.expectedOutput,
            passed,
            durationMs: Math.max(1, Math.round(caseEndTime - caseStartTime)),
          });
        } catch (err: any) {
          results.push({
            testCase: tc,
            actualOutput: 'Runtime Error',
            expectedOutput: tc.expectedOutput,
            passed: false,
            error: err?.message || 'Execution error in test case',
            durationMs: 0,
          });
        }
      }

      const overallEndTime = performance.now();
      const totalTime = Math.max(1, Math.round(overallEndTime - overallStartTime));
      setTotalExecutionTimeMs(totalTime);

      const passedCount = results.filter((r) => r.passed).length;
      const passPercentage = challenge.testCases.length > 0
        ? Math.round((passedCount / challenge.testCases.length) * 100)
        : 100;

      setTestResults(results);
      setConsoleLogs(logs);
      onCodeChange(code, passPercentage);
    } catch (globalErr: any) {
      setConsoleLogs([`[Fatal Syntax Error]: ${globalErr?.message || globalErr}`]);
    } finally {
      setIsRunning(false);
      setRunningStep('');
    }
  };

  const handleReset = () => {
    setCode(challenge.starterCode);
    setTestResults([]);
    setConsoleLogs([]);
  };

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);
  const passedCount = testResults.filter((r) => r.passed).length;
  const lineCount = code.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Bar: Problem Title & Real-time Action Controls */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {challenge.title}
              <span className="text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                Medium Difficulty
              </span>
            </h3>
            <p className="text-xs text-zinc-400">{challenge.realWorldContext}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHints(!showHints)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition border border-zinc-700/60 flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Hints ({challenge.hints.length})</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition border border-zinc-700/60 cursor-pointer"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Big Interactive Run Code Button */}
          <button
            onClick={() => executeCode(true)}
            disabled={isRunning}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-emerald-900/40 flex items-center gap-2 disabled:opacity-50 cursor-pointer group"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                <span>Run Code &amp; Test Cases</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hints Card if opened */}
      {showHints && (
        <div className="bg-amber-950/30 border-b border-amber-900/40 p-4 text-xs text-amber-200 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Hint {activeHintIndex + 1} of {challenge.hints.length}
            </span>
            <div className="space-x-1">
              {challenge.hints.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHintIndex(i)}
                  className={`w-5 h-5 rounded text-[10px] font-mono ${activeHintIndex === i ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <p className="text-zinc-300 font-mono">{challenge.hints[activeHintIndex]}</p>
        </div>
      )}

      {/* Main Work Area: Code Editor + Description Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[440px]">
        {/* Left: Problem Details (5 cols) */}
        <div className="lg:col-span-5 border-r border-zinc-800 p-5 overflow-y-auto bg-zinc-900/40 text-xs text-zinc-300 space-y-4">
          <div>
            <h4 className="font-semibold text-white mb-1.5 text-sm">Challenge Specification</h4>
            <div className="whitespace-pre-line text-zinc-300 font-sans leading-relaxed">
              {challenge.description}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <h5 className="font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Unit Test Cases ({challenge.testCases.length})
            </h5>
            <div className="space-y-2 font-mono text-[11px]">
              {challenge.testCases.map((tc, idx) => (
                <div key={tc.id} className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="text-zinc-400 font-sans mb-1 text-[10px] uppercase tracking-wider flex items-center justify-between">
                    <span>Case {idx + 1}: {tc.description}</span>
                  </div>
                  <div className="text-indigo-300 truncate">Input: {tc.input}</div>
                  <div className="text-emerald-300 truncate">Expected: {tc.expectedOutput}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Live Test Runner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-950">
          <div className="flex-1 flex relative overflow-hidden font-mono text-xs">
            {/* Line Numbers */}
            <div className="w-10 py-4 bg-zinc-900/60 text-zinc-600 select-none text-right pr-3 text-[11px] font-mono leading-6 border-r border-zinc-800/60">
              {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
              }}
              spellCheck={false}
              className="flex-1 p-4 bg-transparent text-emerald-300 font-mono text-xs leading-6 resize-none focus:outline-none selection:bg-indigo-600/40"
              placeholder="// Write your code solution here..."
            />
          </div>

          {/* Bottom Interactive Execution Drawer */}
          <div className="border-t border-zinc-800 bg-zinc-900/95 flex flex-col">
            {/* Tab Controls & Live Runner Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('testcases')}
                  className={`flex items-center gap-1.5 pb-0.5 cursor-pointer ${
                    activeTab === 'testcases' ? 'text-white border-b-2 border-indigo-500 font-bold' : 'text-zinc-400'
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${allPassed ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>Test Cases ({passedCount}/{challenge.testCases.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('console')}
                  className={`flex items-center gap-1.5 pb-0.5 cursor-pointer ${
                    activeTab === 'console' ? 'text-white border-b-2 border-indigo-500 font-bold' : 'text-zinc-400'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Terminal Logs ({consoleLogs.length})</span>
                </button>
              </div>

              {/* Execution Status Badge */}
              <div className="flex items-center gap-2 text-[11px]">
                {isRunning ? (
                  <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>{runningStep || 'Executing...'}</span>
                  </span>
                ) : totalExecutionTimeMs > 0 ? (
                  <span className="text-zinc-400 font-mono flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Time: {totalExecutionTimeMs}ms</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Content Display Area */}
            <div className="p-3.5 max-h-48 overflow-y-auto text-xs font-mono space-y-2">
              {activeTab === 'testcases' ? (
                testResults.length === 0 ? (
                  <div className="text-zinc-500 text-center py-4 flex flex-col items-center gap-2">
                    <Code2 className="w-6 h-6 text-zinc-600 animate-pulse" />
                    <span>Click <strong>&quot;Run Code &amp; Test Cases&quot;</strong> to execute unit assertions.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Execution Summary Header */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        {allPassed ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> All {challenge.testCases.length} Test Cases Passed!
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> {passedCount}/{challenge.testCases.length} Test Cases Passing
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-500 font-mono">Total Execution: {totalExecutionTimeMs}ms</span>
                    </div>

                    {/* Expandable Test Case Items */}
                    {testResults.map((r, idx) => {
                      const isExpanded = expandedCaseIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border overflow-hidden transition ${
                            r.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-rose-950/20 border-rose-500/30'
                          }`}
                        >
                          <div
                            onClick={() => setExpandedCaseIndex(isExpanded ? null : idx)}
                            className="p-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-white/5"
                          >
                            <div className="flex items-center gap-2.5">
                              {r.passed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <span className="font-semibold text-white">
                                Case {idx + 1}: {r.testCase.description}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                r.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {r.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                              <span>{r.durationMs}ms</span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </div>
                          </div>

                          {/* Expanded Diff Detail */}
                          {isExpanded && (
                            <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 space-y-2 text-[11px]">
                              <div>
                                <span className="text-zinc-500 font-sans block text-[10px] uppercase font-bold">Input Expression</span>
                                <code className="text-indigo-300 block bg-zinc-900 p-1.5 rounded border border-zinc-800 break-all">
                                  {r.testCase.input}
                                </code>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-zinc-500 font-sans block text-[10px] uppercase font-bold">Expected Output</span>
                                  <code className="text-emerald-400 block bg-zinc-900 p-1.5 rounded border border-zinc-800 break-all">
                                    {r.expectedOutput}
                                  </code>
                                </div>

                                <div>
                                  <span className="text-zinc-500 font-sans block text-[10px] uppercase font-bold">Actual Output</span>
                                  <code className={`block p-1.5 rounded border break-all ${
                                    r.passed 
                                      ? 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30' 
                                      : 'text-rose-300 bg-rose-950/30 border-rose-500/30'
                                  }`}>
                                    {r.error ? `Error: ${r.error}` : r.actualOutput}
                                  </code>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Terminal Console Log Output */
                <div className="space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 min-h-[90px]">
                  {consoleLogs.length === 0 ? (
                    <span className="text-zinc-600 font-mono text-[11px]">
                      No console.log output. Use <code>console.log()</code> inside your code to inspect variables.
                    </span>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <div key={i} className="text-zinc-300 font-mono text-[11px] leading-5">
                        &gt; {log}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
