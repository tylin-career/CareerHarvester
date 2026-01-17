import React, { useState } from 'react';
import { FileData, AppStatus, CandidateProfile, Job } from './types';
import { analyzeResume, searchMatchingJobs } from './services/api';
import { ResumeUpload } from './components/ResumeUpload';
import { JobCard } from './components/JobCard';
import { JobActionDrawer } from './components/JobActionDrawer';
import { Briefcase, User, RefreshCw, Loader2, FileSearch, Target, ChevronRight, Bookmark } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep file data for actions
  const [currentFileData, setCurrentFileData] = useState<FileData | null>(null);

  // Drawer State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<'SEARCH' | 'SAVED'>('SEARCH');

  const handleUpload = async (fileData: FileData) => {
    setStatus(AppStatus.ANALYZING_RESUME);
    setErrorMsg(null);
    setJobs([]);
    setProfile(null);
    setCurrentFileData(fileData);

    try {
      // Step 1: Analyze
      const analyzedProfile = await analyzeResume(fileData);
      setProfile(analyzedProfile);

      // Step 2: Search
      setStatus(AppStatus.SEARCHING_JOBS);
      const foundJobs = await searchMatchingJobs(analyzedProfile);
      setJobs(foundJobs);

      setStatus(AppStatus.COMPLETE);
    } catch (err) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg("Unable to process the document. Please try again with a different file.");
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setProfile(null);
    setJobs([]);
    setErrorMsg(null);
    setCurrentFileData(null);
    setViewMode('SEARCH');
  };

  const toggleSaveJob = (id: string) => {
    const isAlreadySaved = savedJobs.some(j => j.id === id);

    // Update local jobs list UI
    const updateJobList = (list: Job[]) => list.map(job =>
      job.id === id ? { ...job, saved: !job.saved } : job
    );
    setJobs(updateJobList(jobs));

    // Update Saved Jobs list
    if (isAlreadySaved) {
      setSavedJobs(savedJobs.filter(j => j.id !== id));
    } else {
      const jobToSave = jobs.find(j => j.id === id);
      if (jobToSave) {
        setSavedJobs([...savedJobs, { ...jobToSave, saved: true }]);
      }
    }
  };

  // Handle unsaving from the Saved tab
  const removeFromSaved = (id: string) => {
    setSavedJobs(savedJobs.filter(j => j.id !== id));
    // Also update main list if present
    setJobs(jobs.map(job => job.id === id ? { ...job, saved: false } : job));
  };

  const getSearchLink = (platform: string, query: string) => {
    const q = encodeURIComponent(query);
    switch (platform) {
      case '104': return `https://www.104.com.tw/jobs/search/?keyword=${q}`;
      case '1111': return `https://www.1111.com.tw/search/job?ks=${q}`;
      case 'CakeResume': return `https://www.cakeresume.com/jobs?q=${q}`;
      case 'LinkedIn': return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
      default: return '#';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-900 p-1.5 rounded text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              CareerMatch
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {status === AppStatus.COMPLETE && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('SEARCH')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'SEARCH' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Matches
                </button>
                <button
                  onClick={() => setViewMode('SAVED')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center ${viewMode === 'SAVED' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Saved
                  {savedJobs.length > 0 && <span className="ml-2 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{savedJobs.length}</span>}
                </button>
              </div>
            )}
            {status === AppStatus.COMPLETE && (
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">

        {/* State: IDLE - Landing Area */}
        {status === AppStatus.IDLE && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Align your resume with <br /> the <span className="text-blue-600">right opportunity</span>.
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                Upload your CV to identify your core professional strengths and instantly find relevant openings across major job platforms.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <ResumeUpload onUpload={handleUpload} isAnalyzing={false} />
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              {[
                {
                  icon: <FileSearch className="w-6 h-6 text-gray-700" />,
                  title: 'Skill Extraction',
                  desc: 'Automatically parses technical skills and professional traits from your document.'
                },
                {
                  icon: <Target className="w-6 h-6 text-gray-700" />,
                  title: 'Keyword Match',
                  desc: 'Compare your resume against specific JDs to find missing keywords.'
                },
                {
                  icon: <Briefcase className="w-6 h-6 text-gray-700" />,
                  title: 'Cover Letters',
                  desc: 'Generate tailored cover letters for any job instantly.'
                }
              ].map((feature, i) => (
                <div key={i} className="group">
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl inline-block group-hover:bg-blue-50 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State: PROCESSING */}
        {(status === AppStatus.ANALYZING_RESUME || status === AppStatus.SEARCHING_JOBS) && (
          <div className="max-w-2xl mx-auto mt-20">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {status === AppStatus.ANALYZING_RESUME ? "Analyzing Document" : "Finding Opportunities"}
              </h3>
              <p className="text-gray-500">
                {status === AppStatus.ANALYZING_RESUME
                  ? "Extracting skills, experience, and professional summary..."
                  : "Searching external job boards for matching roles..."}
              </p>
            </div>
          </div>
        )}

        {/* State: ERROR */}
        {status === AppStatus.ERROR && (
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="bg-white p-8 rounded-xl border border-red-100 shadow-sm">
              <div className="text-red-600 font-semibold mb-2">Analysis Failed</div>
              <p className="text-gray-600 mb-6">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* State: RESULTS (SEARCH VIEW) */}
        {status === AppStatus.COMPLETE && profile && viewMode === 'SEARCH' && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10">
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {profile.name !== "Candidate" ? profile.name : "Professional Profile"}
                      </h2>
                      <div className="flex gap-2 mt-1">
                        {profile.suggestedRoles.map((role, i) => (
                          <span key={i} className="text-sm text-gray-500 font-medium flex items-center">
                            {role}
                            {i < profile.suggestedRoles.length - 1 && <span className="mx-2 text-gray-300">•</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Summary</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.summary}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Recommended Opportunities
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {jobs.length} Matches
                </span>
              </div>

              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onToggleSave={toggleSaveJob}
                      onOpenActions={setSelectedJob}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <p className="text-gray-500">No direct matches found via the API. Please use the External Search links above.</p>
                </div>
              )}
            </div>

            {/* Manual Search Bar (Moved to bottom) */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">External Search</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['104', '1111', 'CakeResume', 'LinkedIn'].map(platform => (
                  <a
                    key={platform}
                    href={getSearchLink(platform, profile.suggestedRoles[0] || 'Software Engineer')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all group"
                  >
                    {platform}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State: SAVED JOBS VIEW */}
        {status === AppStatus.COMPLETE && viewMode === 'SAVED' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Saved Jobs
              </h3>
            </div>

            {savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onToggleSave={removeFromSaved}
                    onOpenActions={setSelectedJob}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No saved jobs yet</h3>
                <p className="text-gray-500">Bookmark jobs from the Matches tab to view them here later.</p>
                <button
                  onClick={() => setViewMode('SEARCH')}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  Go to Matches
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Action Drawer */}
      <JobActionDrawer
        job={selectedJob}
        resumeData={currentFileData}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}