"""
AI Teacher Backend - Flask Application
For ENT (Unified National Testing) preparation
Integrated into ozger project
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import asyncio
import time
import json
import hashlib
from collections import OrderedDict


load_dotenv()

from services.gemini_service import get_gemini_service, GeminiService
from services.pdf_service import extract_text_from_pdf

app = Flask(__name__)
CORS(app)


materials_store = {}


_cache = OrderedDict()
_rate_limits = {}

def _get_client_key(data: dict | None) -> str:
    user_id = None
    if isinstance(data, dict):
        user_id = data.get("user_id") or data.get("uid")
    if user_id:
        return f"user:{user_id}"
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    return f"ip:{request.remote_addr or 'unknown'}"

def _rate_limit_check(key: str) -> tuple[bool, int]:
    enabled = os.getenv("AI_RATE_LIMIT_ENABLED", "true").strip().lower() in ("1", "true", "yes")
    if not enabled:
        return True, 0
    try:
        limit = int(os.getenv("AI_RATE_LIMIT_PER_WINDOW", "5"))
    except Exception:
        limit = 5
    try:
        window = int(os.getenv("AI_RATE_LIMIT_WINDOW_SECONDS", "86400"))
    except Exception:
        window = 86400
    now = int(time.time())
    record = _rate_limits.get(key)
    if not record or now - record["start"] >= window:
        _rate_limits[key] = {"start": now, "count": 1}
        return True, 0
    record["count"] += 1
    if record["count"] > limit:
        retry_after = record["start"] + window - now
        return False, retry_after
    return True, 0

def _cache_key(endpoint: str, data: dict, material: str | None) -> str:
    payload = dict(data or {})
    if material:
        payload["material_hash"] = hashlib.sha256(material.encode("utf-8")).hexdigest()
        payload.pop("material", None)
    if payload.get("exclude_questions"):
        payload["exclude_questions_hash"] = hashlib.sha256(
            "\n".join(payload["exclude_questions"]).encode("utf-8")
        ).hexdigest()
        payload.pop("exclude_questions", None)
    payload["endpoint"] = endpoint
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

def _cache_get(key: str):
    try:
        ttl = int(os.getenv("AI_CACHE_TTL_SECONDS", "3600"))
    except Exception:
        ttl = 3600
    if ttl <= 0:
        return None
    item = _cache.get(key)
    if not item:
        return None
    if time.time() - item["ts"] > ttl:
        _cache.pop(key, None)
        return None
    _cache.move_to_end(key)
    return item["value"]

def _cache_set(key: str, value):
    try:
        max_size = int(os.getenv("AI_CACHE_MAX", "64"))
    except Exception:
        max_size = 64
    if max_size <= 0:
        return
    _cache[key] = {"ts": time.time(), "value": value}
    _cache.move_to_end(key)
    while len(_cache) > max_size:
        _cache.popitem(last=False)


def run_async(coro):
    """Helper to run async functions in sync context"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "AI Teacher API is running"})


@app.route('/api/upload', methods=['POST'])
def upload_material():
    """
    Upload learning material (text or PDF)
    
    Request:
        - Form data with 'file' (PDF) or 'text' field
        
    Response:
        - material_id: ID to reference the material
        - preview: First 500 characters of extracted text
    """
    try:
        material_text = ""
        
       
        if 'file' in request.files:
            file = request.files['file']
            if file.filename.lower().endswith('.pdf'):
                material_text = extract_text_from_pdf(file)
            else:
                return jsonify({"error": "Тек PDF файлдары қолдау көрсетіледі"}), 400
        
        elif 'text' in request.form:
            material_text = request.form['text']
        
        elif request.is_json:
            data = request.get_json()
            material_text = data.get('text', '')
        
        if not material_text or not material_text.strip():
            return jsonify({"error": "Материал табылмады"}), 400
        

        import hashlib
        material_id = hashlib.md5(material_text[:100].encode()).hexdigest()[:12]
        

        materials_store[material_id] = material_text
        
        return jsonify({
            "material_id": material_id,
            "preview": material_text[:500] + ("..." if len(material_text) > 500 else ""),
            "length": len(material_text)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate/learn', methods=['POST'])
def generate_learn():
    """
    Generate learning plan with content and questions
    
    Request JSON:
        - material_id: ID of uploaded material
        OR
        - material: Raw material text
        - history_mode: Boolean for History Mode (3-view format)
        
    Response:
        - plan: Array of learning sections with content and questions
    """
    try:
        data = request.get_json()
        
     
        client_key = _get_client_key(data)
        allowed, retry_after = _rate_limit_check(client_key)
        if not allowed:
            return jsonify({"error": "Лимит запросов достигнут. Попробуйте позже."}), 429, {
                "Retry-After": str(retry_after)
            }

  
        material_id = data.get('material_id')
        material = data.get('material')
        history_mode = data.get('history_mode', False)
        language = data.get('language') or data.get('lang')
        
        if material_id and material_id in materials_store:
            material = materials_store[material_id]
        
        if not material:
            return jsonify({"error": "Материал табылмады"}), 400
        
      
        cache_key = _cache_key("learn", data, material)
        cached = _cache_get(cache_key)
        if cached:
            return jsonify(cached)

        
        gemini = get_gemini_service()
        result = run_async(gemini.generate_learn_content(material, history_mode, language))
        _cache_set(cache_key, result)

        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate/practice', methods=['POST'])
def generate_practice():
    """
    Generate practice questions and flashcards
    
    Request JSON:
        - material_id: ID of uploaded material OR material: Raw text
        - count: Number of questions (10, 15, 20, 25, 30)
        - exclude_questions: Optional array of questions to exclude
        
    Response:
        - flashcards: Array of flashcard objects
        - questions: Array of question objects with explanations
    """
    try:
        data = request.get_json()
        
      
        client_key = _get_client_key(data)
        allowed, retry_after = _rate_limit_check(client_key)
        if not allowed:
            return jsonify({"error": "Лимит запросов достигнут. Попробуйте позже."}), 429, {
                "Retry-After": str(retry_after)
            }


        material_id = data.get('material_id')
        material = data.get('material')
        count = data.get('count', 10)
        exclude_questions = data.get('exclude_questions', [])
        language = data.get('language') or data.get('lang')
        
        if material_id and material_id in materials_store:
            material = materials_store[material_id]
        
        if not material:
            return jsonify({"error": "Материал табылмады"}), 400
        
        
        if count not in [10, 15, 20, 25, 30]:
            count = 10
        
        
        cache_key = _cache_key("practice", data, material)
        cached = _cache_get(cache_key)
        if cached:
            return jsonify(cached)

       
        gemini = get_gemini_service()
        result = run_async(gemini.generate_practice_questions(material, count, exclude_questions, language))
        _cache_set(cache_key, result)

        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate/realtest', methods=['POST'])
def generate_realtest():
    """
    Generate real test questions (no hints, no explanations during test)
    
    Request JSON:
        - material_id: ID of uploaded material OR material: Raw text
        - count: Number of questions
        
    Response:
        - questions: Array of question objects (no explanations)
    """
    try:
        data = request.get_json()
        
        
        client_key = _get_client_key(data)
        allowed, retry_after = _rate_limit_check(client_key)
        if not allowed:
            return jsonify({"error": "Лимит запросов достигнут. Попробуйте позже."}), 429, {
                "Retry-After": str(retry_after)
            }

        
        material_id = data.get('material_id')
        material = data.get('material')
        count = data.get('count', 10)
        language = data.get('language') or data.get('lang')
        
        if material_id and material_id in materials_store:
            material = materials_store[material_id]
        
        if not material:
            return jsonify({"error": "Материал табылмады"}), 400
        
       
        if count not in [10, 15, 20, 25, 30]:
            count = 10
        
       
        cache_key = _cache_key("realtest", data, material)
        cached = _cache_get(cache_key)
        if cached:
            return jsonify(cached)

       
        gemini = get_gemini_service()
        result = run_async(gemini.generate_realtest_questions(material, count, language))
        _cache_set(cache_key, result)

        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate/continue', methods=['POST'])
def generate_continue():
    """
    Generate new questions for "Continue with other questions" feature
    
    Request JSON:
        - material_id: ID of uploaded material OR material: Raw text
        - count: Number of new questions
        - previous_questions: Array of previous question texts to exclude
        
    Response:
        - flashcards: New flashcards
        - questions: New questions (different from previous)
    """
    try:
        data = request.get_json()
        
        
        client_key = _get_client_key(data)
        allowed, retry_after = _rate_limit_check(client_key)
        if not allowed:
            return jsonify({"error": "Лимит запросов достигнут. Попробуйте позже."}), 429, {
                "Retry-After": str(retry_after)
            }

        material_id = data.get('material_id')
        material = data.get('material')
        count = data.get('count', 10)
        previous_questions = data.get('previous_questions', [])
        language = data.get('language') or data.get('lang')
        
        if material_id and material_id in materials_store:
            material = materials_store[material_id]
        
        if not material:
            return jsonify({"error": "Материал табылмады"}), 400
        
       
        cache_key = _cache_key("continue", data, material)
        cached = _cache_get(cache_key)
        if cached:
            return jsonify(cached)

        
        gemini = get_gemini_service()
        result = run_async(gemini.generate_practice_questions(material, count, previous_questions, language))
        _cache_set(cache_key, result)

        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', os.getenv('AI_TEACHER_PORT', 5000)))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 AI Teacher API starting on port {port}")
    print(f"📚 Ready to help with ENT preparation!")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

