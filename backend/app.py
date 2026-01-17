"""
CareerHarvester Backend API
---------------------------
Flask application providing AI-powered career consulting services:
- Resume analysis and skill extraction
- Real-time job search using AI agent with web search
- Job compatibility analysis
- Cover letter generation
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

from resume_parser import parse_resume
from agent import (
    JobSearchAgent,
    ResumeAnalyzer,
    CoverLetterGenerator,
    JobMatchAnalyzer
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI Client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY environment variable is not set!")
    raise RuntimeError("OPENAI_API_KEY is required. Please set it in your .env file.")

client = OpenAI(api_key=openai_api_key)

# Configuration
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Initialize AI agents
resume_analyzer = ResumeAnalyzer(client, model=MODEL)
job_search_agent = JobSearchAgent(client, model=MODEL)
cover_letter_generator = CoverLetterGenerator(client, model=MODEL)
job_match_analyzer = JobMatchAnalyzer(client, model=MODEL)


# ============================================================================
# API Routes
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "CareerHarvester Backend",
        "model": MODEL
    })


@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    """
    Analyze uploaded resume and extract candidate profile.
    
    Expects: multipart/form-data with 'file' field
    Returns: JSON with name, summary, skills, suggestedRoles
    """
    if 'file' not in request.files:
        logger.warning("Resume analysis request missing file")
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        # Read file content
        file_content = file.read()
        filename = file.filename
        mime_type = file.content_type
        
        logger.info(f"Processing resume: {filename} ({mime_type})")
        
        # Parse resume to extract text
        resume_text = parse_resume(file_content, filename, mime_type)
        
        if not resume_text or len(resume_text.strip()) < 50:
            return jsonify({
                "error": "Could not extract meaningful content from the file. Please ensure it's a valid resume."
            }), 400
        
        # Analyze with AI
        profile = resume_analyzer.analyze(resume_text)
        
        logger.info(f"Successfully analyzed resume for: {profile.get('name', 'Unknown')}")
        return jsonify(profile)
        
    except ValueError as e:
        logger.warning(f"Invalid file format: {e}")
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        logger.error(f"Resume processing error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Unexpected error in resume analysis: {e}", exc_info=True)
        return jsonify({"error": "Failed to analyze resume. Please try again."}), 500


@app.route('/api/search-jobs', methods=['POST'])
def search_jobs():
    """
    Search for job listings matching candidate profile.
    
    Expects: JSON with roles, skills, location (optional)
    Returns: Array of job listings
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    roles = data.get('roles', [])
    skills = data.get('skills', [])
    location = data.get('location', 'Taiwan')
    
    if not roles and not skills:
        return jsonify({"error": "At least one role or skill is required"}), 400
    
    try:
        logger.info(f"Searching jobs - Roles: {roles}, Location: {location}")
        
        # Use AI agent with web search
        jobs = job_search_agent.search_jobs(roles, skills, location)
        
        logger.info(f"Found {len(jobs)} matching jobs")
        return jsonify(jobs)
        
    except Exception as e:
        logger.error(f"Job search error: {e}", exc_info=True)
        # Return empty array on error (frontend handles gracefully)
        return jsonify([])


@app.route('/api/analyze-job-match', methods=['POST'])
def analyze_job_match():
    """
    Analyze resume-job compatibility.
    
    Expects: multipart/form-data with 'file' and 'jobDescription' fields
    Returns: JSON with missingKeywords, matchScore, advice
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    job_description = request.form.get('jobDescription', '')
    if not job_description.strip():
        return jsonify({"error": "Job description is required"}), 400
    
    file = request.files['file']
    
    try:
        file_content = file.read()
        filename = file.filename
        mime_type = file.content_type
        
        # Parse resume
        resume_text = parse_resume(file_content, filename, mime_type)
        
        # Analyze match
        result = job_match_analyzer.analyze_match(resume_text, job_description)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Job match analysis error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """
    Generate tailored cover letter.
    
    Expects: multipart/form-data with 'file' and 'jobDescription' fields
    Returns: JSON with coverLetter field
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    job_description = request.form.get('jobDescription', '')
    if not job_description.strip():
        return jsonify({"error": "Job description is required"}), 400
    
    file = request.files['file']
    
    try:
        file_content = file.read()
        filename = file.filename
        mime_type = file.content_type
        
        # Parse resume
        resume_text = parse_resume(file_content, filename, mime_type)
        
        # Generate cover letter
        cover_letter = cover_letter_generator.generate(resume_text, job_description)
        
        return jsonify({"coverLetter": cover_letter})
        
    except Exception as e:
        logger.error(f"Cover letter generation error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    
    logger.info(f"Starting CareerHarvester Backend on port {port}")
    logger.info(f"Using OpenAI model: {MODEL}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
