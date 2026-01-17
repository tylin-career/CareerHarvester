import React, { useState } from 'react';
import { Job, FileData, KeywordAnalysis } from '../types';
import { X, Sparkles, FileText, CheckCircle2, Copy, PenTool, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { analyzeJobCompatibility, generateCoverLetter } from '../services/api';

interface JobActionDrawerProps {
  job: Job | null;
  resumeData: FileData | null;
  onClose: () => void;
}

type Tab = 'SETUP' | 'KEYWORDS' | 'COVER_LETTER';

export const JobActionDrawer: React.FC<JobActionDrawerProps> = ({ job, resumeData, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('SETUP');
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  // Initialize with title and company when job opens
  React.useEffect(() => {
    if (job) {
      setJobDescription(`${job.title} at ${job.company}\n\n[Paste the full Job Description here for best results...]`);
      setActiveTab('SETUP');
      setAnalysis(null);
      setCoverLetter(null);
    }
  }, [job]);

  if (!job) return null;

  const handleAnalyze = async () => {
    if (!resumeData) return;
    setIsProcessing(true);
    try {
      const result = await analyzeJobCompatibility(resumeData, jobDescription);
      setAnalysis(result);
      setActiveTab('KEYWORDS');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeData) return;
    setIsProcessing(true);
    try {
      const result = await generateCoverLetter(resumeData, jobDescription);
      setCoverLetter(result);
      setActiveTab('COVER_LETTER');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">{job.title}</h2>
            <p className="text-sm text-gray-500">{job.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto bg-gray-50">

          {/* Tab: SETUP (Input JD) */}
          {activeTab === 'SETUP' && (
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">AI Assistant</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Paste the full job description below. I'll compare it with your resume to find missing keywords or write a tailored cover letter.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Context</label>
                <textarea
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />}
                  Check Resume Keywords
                </button>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenTool className="w-4 h-4 mr-2" />}
                  Generate Cover Letter
                </button>
              </div>
            </div>
          )}

          {/* Tab: KEYWORDS (Result) */}
          {activeTab === 'KEYWORDS' && analysis && (
            <div className="p-6">
              <button onClick={() => setActiveTab('SETUP')} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center">
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
              </button>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Match Score</h3>
                  <span className={`text-xl font-bold ${analysis.matchScore > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {analysis.matchScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-gray-900 h-2 rounded-full transition-all duration-1000" style={{ width: `${analysis.matchScore}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{analysis.advice}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.length > 0 ? (
                    analysis.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-sm font-medium flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1.5" />
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No major keywords missing. Good job!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: COVER LETTER (Result) */}
          {activeTab === 'COVER_LETTER' && coverLetter && (
            <div className="p-6">
              <button onClick={() => setActiveTab('SETUP')} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center">
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
              </button>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 text-sm">Generated Draft</h3>
                  <button
                    onClick={() => copyToClipboard(coverLetter)}
                    className="text-gray-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                    {coverLetter}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
