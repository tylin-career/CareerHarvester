"""
Job Search Agent Module
-----------------------
AI Agent that uses OpenAI's Responses API with web_search_preview tool
to search for real job listings on the internet.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from openai import OpenAI

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class JobListing:
    """Represents a single job listing."""
    id: str
    title: str
    company: str
    platform: str
    link: str
    salary: str
    tags: List[str]
    location: Optional[str] = None
    description: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


class JobSearchAgent:
    """
    AI Agent for searching job listings using OpenAI's web search capabilities.
    
    Uses the Responses API with web_search_preview tool to find real job
    listings from across the internet.
    """
    
    def __init__(self, client: OpenAI, model: str = "gpt-4o-mini"):
        """
        Initialize the job search agent.
        
        Args:
            client: OpenAI client instance
            model: Model to use for the agent (default: gpt-4o-mini)
        """
        self.client = client
        self.model = model
    
    def _build_search_query(
        self,
        roles: List[str],
        skills: List[str],
        location: str = "Taiwan"
    ) -> str:
        """Build an optimized search query for job hunting."""
        role_str = " OR ".join(f'"{role}"' for role in roles[:3])
        skill_str = ", ".join(skills[:5])
        
        return f"""
        Search for current job openings with these criteria:
        - Job Titles: {role_str}
        - Required Skills: {skill_str}
        - Location: {location}
        
        Focus on job boards like:
        - 104.com.tw (Taiwan)
        - CakeResume
        - LinkedIn Jobs
        - 1111.com.tw (Taiwan)
        - Indeed
        
        Find 6-8 REAL, CURRENTLY OPEN positions.
        """
    
    def search_jobs(
        self,
        roles: List[str],
        skills: List[str],
        location: str = "Taiwan"
    ) -> List[Dict[str, Any]]:
        """
        Search for job listings matching the candidate profile.
        
        Args:
            roles: List of job titles/roles the candidate is suited for
            skills: List of candidate's skills
            location: Preferred job location
            
        Returns:
            List of job listing dictionaries
        """
        logger.info(f"Searching jobs for roles: {roles}, location: {location}")
        
        search_query = self._build_search_query(roles, skills, location)
        
        system_prompt = """You are a professional job search agent. Your task is to:
1. Search the web for real, current job openings
2. Extract accurate job information including title, company, platform, and URL
3. Return ONLY real jobs with valid URLs that exist right now

CRITICAL: Only return jobs you find through web search. Do NOT make up or hallucinate job listings.

For the platform field, use one of: "104", "1111", "CakeResume", "LinkedIn", "Indeed", "Other"

Return your findings as a JSON object with this exact structure:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "platform": "Platform Name",
      "link": "https://actual-job-url.com/job/123",
      "salary": "Salary range or 'Not disclosed'",
      "location": "City, Country",
      "tags": ["skill1", "skill2", "skill3"],
      "description": "Brief 1-2 sentence description"
    }
  ],
  "search_summary": "Brief summary of search performed"
}"""

        try:
            # Use the Responses API with web search tool
            response = self.client.responses.create(
                model=self.model,
                tools=[{"type": "web_search_preview"}],
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": search_query}
                ]
            )
            
            # Extract the response content
            result_text = None
            for output in response.output:
                if output.type == "message":
                    for content in output.content:
                        if content.type == "output_text":
                            result_text = content.text
                            break
            
            if not result_text:
                logger.warning("No text response from agent")
                return []
            
            # Parse JSON from response
            # Handle case where response might have markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            result_json = json.loads(result_text.strip())
            jobs = result_json.get("jobs", [])
            
            # Add IDs to jobs
            processed_jobs = []
            for idx, job in enumerate(jobs):
                job["id"] = f"job-{idx}-{hash(job.get('link', ''))}"
                # Normalize platform name
                platform = job.get("platform", "Other")
                if "104" in platform.lower():
                    job["platform"] = "104"
                elif "1111" in platform.lower():
                    job["platform"] = "1111"
                elif "cake" in platform.lower():
                    job["platform"] = "CakeResume"
                elif "linkedin" in platform.lower():
                    job["platform"] = "LinkedIn"
                elif "indeed" in platform.lower():
                    job["platform"] = "Other"
                else:
                    job["platform"] = "Other"
                    
                processed_jobs.append(job)
            
            logger.info(f"Found {len(processed_jobs)} job listings")
            return processed_jobs
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse job search response: {e}")
            logger.debug(f"Raw response: {result_text}")
            return []
        except Exception as e:
            logger.error(f"Job search failed: {e}")
            raise


class ResumeAnalyzer:
    """
    Analyzes resume content using OpenAI to extract candidate profile.
    """
    
    def __init__(self, client: OpenAI, model: str = "gpt-4o-mini"):
        """
        Initialize the resume analyzer.
        
        Args:
            client: OpenAI client instance
            model: Model to use for analysis
        """
        self.client = client
        self.model = model
    
    def analyze(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze resume text and extract candidate profile.
        
        Args:
            resume_text: Extracted text content from resume
            
        Returns:
            Dictionary containing name, summary, skills, and suggestedRoles
        """
        logger.info("Analyzing resume content...")
        
        # Truncate if too long (keeping first 6000 chars for context)
        if len(resume_text) > 6000:
            resume_text = resume_text[:6000] + "\n[Content truncated...]"
        
        system_prompt = """You are an expert career consultant and resume analyst. 
Analyze resumes thoroughly and extract key information accurately.
Always respond with valid JSON."""

        user_prompt = f"""Analyze this resume and extract the following information:

RESUME CONTENT:
{resume_text}

---

Please extract:
1. **Name**: The candidate's full name. If not clearly stated, use "Candidate"
2. **Summary**: A 2-3 sentence professional summary highlighting their key strengths, experience level, and career focus
3. **Skills**: 6-10 distinct technical skills, tools, or professional competencies (prioritize hard skills)
4. **Suggested Roles**: 3 specific job titles that best match this profile

Return ONLY valid JSON with this structure:
{{
  "name": "Full Name",
  "summary": "Professional summary...",
  "skills": ["skill1", "skill2", ...],
  "suggestedRoles": ["Role 1", "Role 2", "Role 3"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3  # Lower temperature for more consistent extraction
            )
            
            result_text = response.choices[0].message.content
            profile = json.loads(result_text)
            
            # Validate required fields
            required_fields = ["name", "summary", "skills", "suggestedRoles"]
            for field in required_fields:
                if field not in profile:
                    logger.warning(f"Missing field in profile: {field}")
                    profile[field] = [] if field in ["skills", "suggestedRoles"] else "Unknown"
            
            logger.info(f"Successfully analyzed resume for: {profile.get('name', 'Unknown')}")
            return profile
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse resume analysis: {e}")
            raise RuntimeError("Failed to analyze resume - invalid response format")
        except Exception as e:
            logger.error(f"Resume analysis failed: {e}")
            raise


class CoverLetterGenerator:
    """Generates tailored cover letters based on resume and job description."""
    
    def __init__(self, client: OpenAI, model: str = "gpt-4o-mini"):
        self.client = client
        self.model = model
    
    def generate(self, resume_text: str, job_description: str) -> str:
        """Generate a cover letter for a specific job."""
        logger.info("Generating cover letter...")
        
        prompt = f"""Write a professional, compelling cover letter for this job application.

JOB DESCRIPTION:
{job_description[:2000]}

CANDIDATE'S RESUME:
{resume_text[:3000]}

---

Guidelines:
- Professional yet personable tone
- Highlight relevant experience from the resume
- Show enthusiasm for the specific role and company
- Keep it concise (300-400 words)
- Include a strong opening and call to action

Return JSON with: {{"coverLetter": "Your cover letter text..."}}"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert cover letter writer. Respond in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("coverLetter", "")


class JobMatchAnalyzer:
    """Analyzes how well a resume matches a specific job description."""
    
    def __init__(self, client: OpenAI, model: str = "gpt-4o-mini"):
        self.client = client
        self.model = model
    
    def analyze_match(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze resume-job compatibility."""
        logger.info("Analyzing job match...")
        
        prompt = f"""Analyze how well this resume matches the job description.

JOB DESCRIPTION:
{job_description[:2000]}

RESUME:
{resume_text[:3000]}

---

Provide:
1. **Missing Keywords**: Skills/qualifications mentioned in the job but missing from resume
2. **Match Score**: 0-100 score based on skills, experience, and qualification alignment
3. **Advice**: Specific suggestions to improve the resume for this role

Return JSON:
{{
  "missingKeywords": ["keyword1", "keyword2", ...],
  "matchScore": 75,
  "advice": "Specific advice..."
}}"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a career coach expert. Respond in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        return json.loads(response.choices[0].message.content)
