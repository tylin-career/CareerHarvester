import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes by default

# Initialize OpenAI Client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

def get_openai_model():
    # Use gpt-4o-mini as requested
    return "gpt-4o-mini"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "CareerHarvester Backend"})

@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    
    if 'file' not in request.files and not mock_mode:
        return jsonify({"error": "No file part"}), 400
    
    if mock_mode:
        print("MOCK MODE: Returning dummy resume analysis")
        return jsonify({
            "name": "Alex Chen",
            "summary": "Experienced Full Stack Developer with 5 years in React and Python. Passionate about building scalable web applications and AI integration.",
            "skills": ["React", "TypeScript", "Python", "Flask", "Docker", "AWS", "CI/CD", "PostgreSQL"],
            "suggestedRoles": ["Senior Frontend Engineer", "Full Stack Developer", "Software Architect"]
        })

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read file content
        # For a real app, handle different file types (PDF, DOCX).
        # Assuming text/plain or simplistic parsing for now, or just passing text if possible.
        # But user uploads files. We can use OpenAI File Search / Uploads or just parse text if it's simple.
        # Given the "frontend" parsed it as base64 or file, let's try to extract text or just describe it.
        # For simplicity in this demo: Assume it's a text file or we just use the filename/mock if binary. 
        # IMPROVEMENT: Use pypdf or python-docx to extract text.
        
        # NOTE: For this implementation, we will assume we can extract text from the file 
        # or that the user uploads a text-readable format.
        # Let's try to decode as utf-8 (Markdown/TXT)
        try:
            file_content = file.read().decode('utf-8')
        except:
            file_content = f"Binary file: {file.filename}. (Text extraction implementation needed)"

        prompt = f"""
        You are an expert career consultant. Analyze the following resume content:
        {file_content[:4000]} (truncated if too long)
        
        1. Identify the candidate's name (or "Candidate" if not found).
        2. Write a 2-sentence professional summary highlighting their key strengths and experience level.
        3. Extract 6-8 distinct technical skills or professional "traits" (tags) that are most relevant for job searching.
        4. Suggest 3 specific job titles that fit this profile perfectly.
        
        Return response in valid JSON format with keys: name, summary, skills, suggestedRoles.
        """

        response = client.chat.completions.create(
            model=get_openai_model(),
            messages=[
                {"role": "system", "content": "You are a helpful career assistant. Respond in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content
        return jsonify(json.loads(result_text))

    except Exception as e:
        print(f"Error analyzing resume: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/search-jobs', methods=['POST'])
def search_jobs():
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    
    data = request.json
    roles = data.get('roles', [])
    skills = data.get('skills', [])
    location = data.get('location', 'Taiwan')
    
    if mock_mode:
        print("MOCK MODE: Returning dummy jobs")
        return jsonify([
            {
                "title": "Senior Frontend Developer",
                "company": "TechGlobal Taiwan",
                "platform": "104",
                "link": "https://www.104.com.tw/job/mock1",
                "salary": "1.2M - 1.5M TWD",
                "tags": ["React", "TypeScript", "Remote"]
            },
            {
                "title": "Full Stack Engineer",
                "company": "AI Startup Inc.",
                "platform": "CakeResume",
                "link": "https://www.cakeresume.com/companies/mock/jobs/mock2",
                "salary": "1.5M - 2.0M TWD",
                "tags": ["Python", "Flask", "Vue.js"]
            },
             {
                "title": "Software Architect",
                "company": "Cloud Corp",
                "platform": "LinkedIn",
                "link": "https://www.linkedin.com/jobs/view/mock3",
                "salary": "Negotiable",
                "tags": ["AWS", "Microservices", "System Design"]
            }
        ])

    query = f"Find recent job openings in {location} for {' or '.join(roles)} with skills in {', '.join(skills[:3])}."
    
    # In a real scenario, we would use a Search Tool or scrape.
    # Here we use LLM to hallucinate realistic options or "Search" if we had the tool enabled.
    # Since we don't have a real search tool in this backend implementation yet, we will ask GPT to generate mock listings based on real criteria.
    
    prompt = f"""
    {query}
    Based on the search criteria, create a list of 6-8 REALISTIC job openings that would likely exist.
    Return JSON array of objects with title, company, platform, link, salary, tags.
    Format: {{ "jobs": [ ... ] }}
    """
    
    try:
        response = client.chat.completions.create(
            model=get_openai_model(),
            messages=[
                 {"role": "system", "content": "You are a job search assistant. Provide realistic results in JSON."},
                 {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        jobs = result_json.get('jobs', [])
        
        return jsonify(jobs)
    except Exception as e:
        print(f"Error searching jobs: {e}")
        return jsonify([])

@app.route('/api/analyze-job-match', methods=['POST'])
def analyze_job_match():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    job_description = request.form.get('jobDescription', '')
    
    file = request.files['file']
    try:
        file_content = file.read().decode('utf-8')
    except:
        file_content = "[Binary File Content]"

    prompt = f"""
    I am applying for this job: "{job_description}".
    Compare my resume content:
    "{file_content[:2000]}"...
    
    1. Identify missing keywords or skills that are critical for this specific job but missing from my resume.
    2. Give a compatibility score (0-100).
    3. Provide brief advice on how to tailor my resume for this role.
    
    Return JSON with keys: missingKeywords, matchScore, advice.
    """
    
    try:
        response = client.chat.completions.create(
            model=get_openai_model(),
            messages=[
                 {"role": "system", "content": "You are a career coach. Respond in JSON."},
                 {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return jsonify(json.loads(response.choices[0].message.content))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    job_description = request.form.get('jobDescription', '')
    
    file = request.files['file']
    try:
        file_content = file.read().decode('utf-8')
    except:
        file_content = "[Binary File Content]"
        
    prompt = f"""
    Write a professional, persuasive cover letter for the following job:
    "{job_description}"
    
    Use the following resume details to highlight relevant experience:
    "{file_content[:2000]}"...
    
    The tone should be professional, confident, and tailored to the company.
    Keep it concise (under 400 words).
    Return JSON with key: coverLetter.
    """
    
    try:
        response = client.chat.completions.create(
            model=get_openai_model(),
            messages=[
                 {"role": "system", "content": "You are a professional writer. Respond in JSON."},
                 {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return jsonify(json.loads(response.choices[0].message.content))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
