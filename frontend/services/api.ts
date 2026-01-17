import { CandidateProfile, Job, FileData, KeywordAnalysis } from "../types";

const API_BASE_URL = '/api';

/**
 * Step 1: Analyze the Resume.
 * Uploads the file to the backend for analysis.
 */
export const analyzeResume = async (data: FileData): Promise<CandidateProfile> => {
    const formData = new FormData();
    if (data.file) {
        formData.append('file', data.file);
    } else if (data.base64) {
        // Convert base64 back to blob if needed, but optimally the backend handles file uploads.
        // For now, let's assume we pass what we have. 
        // If we only have base64 (from drag-drop without file object persistence?), we might need to reconstruct.
        // In ResumeUpload.tsx usually we have the File object.

        // If we only have base64 string (rare in this app structure), we'd send it as json.
        // But let's Stick to FormData for file uploads.
        // If data.file is missing, we might be in trouble unless we handle base64 on backend.
        // Let's assume data.file is present as per App flow.
        throw new Error("File object is missing.");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/analyze-resume`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Resume Analysis Error:", error);
        throw error;
    }
};

/**
 * Step 2: Search for Jobs.
 */
export const searchMatchingJobs = async (profile: CandidateProfile): Promise<Job[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/search-jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roles: profile.suggestedRoles,
                skills: profile.skills,
                location: 'Taiwan' // Default or extracted from profile
            }),
        });

        if (!response.ok) {
            throw new Error(`Job search failed: ${response.statusText}`);
        }

        const rawJobs = await response.json();
        return rawJobs.map((job: any, index: number) => ({
            id: job.id || `job-${index}-${Date.now()}`,
            title: job.title || "Unknown Role",
            company: job.company || "Unknown Company",
            platform: job.platform || 'Other',
            link: job.link || "#",
            salary: job.salary || "Negotiable",
            tags: job.tags || [],
            saved: false
        }));
    } catch (error) {
        console.error("Job Search Error:", error);
        return [];
    }
};

/**
 * Feature: Optimize Resume Keywords based on Job Description
 */
export const analyzeJobCompatibility = async (resumeData: FileData, jobContext: string): Promise<KeywordAnalysis> => {
    const formData = new FormData();
    if (resumeData.file) {
        formData.append('file', resumeData.file);
    }
    formData.append('jobDescription', jobContext);

    const response = await fetch(`${API_BASE_URL}/analyze-job-match`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to analyze job compatibility");
    }

    return await response.json();
};

/**
 * Feature: Generate Cover Letter
 */
export const generateCoverLetter = async (resumeData: FileData, jobContext: string): Promise<string> => {
    const formData = new FormData();
    if (resumeData.file) {
        formData.append('file', resumeData.file);
    }
    formData.append('jobDescription', jobContext);

    const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        return "Could not generate cover letter.";
    }

    const result = await response.json();
    return result.coverLetter;
};
