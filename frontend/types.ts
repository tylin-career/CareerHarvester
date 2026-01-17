export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  platform: '104' | '1111' | 'CakeResume' | 'LinkedIn' | 'Other';
  link: string;
  tags: string[];
  description?: string; // Optional full description
  saved?: boolean; // New: Saved state
}

export interface CandidateProfile {
  name: string;
  summary: string;
  skills: string[];
  suggestedRoles: string[];
}

export interface AnalysisResult {
  profile: CandidateProfile;
  jobs: Job[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING_RESUME = 'ANALYZING_RESUME',
  SEARCHING_JOBS = 'SEARCHING_JOBS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
  file?: File;
  useCloud?: boolean;
}

// New types for the Action Drawer
export type ActionTab = 'OVERVIEW' | 'KEYWORDS' | 'COVER_LETTER';

export interface KeywordAnalysis {
  missingKeywords: string[];
  matchScore: number;
  advice: string;
}
