"""
Google Gemini API Service
Handles all AI generation for learning content, questions, and tests
"""

import google.generativeai as genai
import json
import os
import time
import datetime
import math
import hashlib
from collections import OrderedDict
from typing import Optional, Tuple


class GeminiService:
    """Service for interacting with Google Gemini API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini service with API key"""
        self.api_key = api_key or self._select_api_key()
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")
        
        genai.configure(api_key=self.api_key)
        
        # Configure generation settings with higher token limit
        generation_config = genai.GenerationConfig(
            temperature=0.7,
            max_output_tokens=16384,  # Increased for large PDFs
        )
        
        self.model = genai.GenerativeModel(
            'gemini-3-flash-preview',
            generation_config=generation_config
        )
        
        # IMPORTANT: keep retries low; frontend expects one generation per click.
        # If Gemini times out, user can retry manually.
        try:
            self.max_retries = max(1, int(os.getenv("GEMINI_MAX_RETRIES", "1")))
        except Exception:
            self.max_retries = 1
        try:
            self.retry_delay = max(0.0, float(os.getenv("GEMINI_RETRY_DELAY", "2")))
        except Exception:
            self.retry_delay = 2.0  # seconds
        
        # Large material processing controls (reduce request count)
        summarize_flag = os.getenv("GEMINI_SUMMARIZE_LARGE", "false").strip().lower()
        self.summarize_large = summarize_flag in ("1", "true", "yes")
        try:
            self.max_chunks = int(os.getenv("GEMINI_MAX_CHUNKS", "8"))
        except Exception:
            self.max_chunks = 8
        self.max_chunks = max(2, min(16, self.max_chunks))
        try:
            self.min_chunk_chars = int(os.getenv("GEMINI_MIN_CHUNK_CHARS", "30000"))
        except Exception:
            self.min_chunk_chars = 30000
        try:
            self.max_chunk_chars = int(os.getenv("GEMINI_MAX_CHUNK_CHARS", "200000"))
        except Exception:
            self.max_chunk_chars = 200000

        # In-memory cache for summarized materials (reduces repeat calls)
        try:
            self.summary_cache_max = int(os.getenv("GEMINI_SUMMARY_CACHE_MAX", "32"))
        except Exception:
            self.summary_cache_max = 32
        self.summary_cache_max = max(0, min(200, self.summary_cache_max))
        self._summary_cache: "OrderedDict[str, str]" = OrderedDict()

        # Base system prompt for ENT preparation
        self.system_prompt = """
Сен - ЕНТ дайындық үшін AI оқытушысың (Қазақстандағы мектеп түлектерінің бірыңғай ұлттық тестілеуі).

МАҢЫЗДЫ ЕРЕЖЕЛЕР:
1. Деңгей: Мектеп деңгейі, ЕНТ форматы
2. ТЕКСТІ БЕРІЛГЕН МАТЕРИАЛДАН ҒАНА пайдалан
3. Күндер, есімдер, оқиғалар - дәл болуы керек
4. Интерпретация немесе пікірлерден аулақ бол
5. Жалған жауаптар шатастыратын, бірақ қате болуы керек

IMPORTANT RULES:
1. Level: School level, ENT format
2. Use ONLY the provided material
3. Dates, names, events must be exact
4. Avoid interpretation or opinions
5. Wrong answers should be confusing but incorrect
"""

    def _select_api_key(self) -> Optional[str]:
        """Select API key based on time window (hourly rotation)."""
        raw_keys = os.getenv("GEMINI_API_KEYS", "").strip()
        if raw_keys:
            keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
            if keys:
                rotate_hours = int(os.getenv("GEMINI_ROTATE_HOURS", "1"))
                rotate_hours = max(1, rotate_hours)
                epoch_hours = int(datetime.datetime.utcnow().timestamp() // 3600)
                index = (epoch_hours // rotate_hours) % len(keys)
                return keys[index]

        return os.getenv("GEMINI_API_KEY")
    def _normalize_lang(self, lang: Optional[str]) -> str:
        if not lang:
            return "kk"
        lang = lang.strip().lower()
        if lang.startswith("ru"):
            return "ru"
        if lang.startswith("en"):
            return "en"
        return "kk"

    def _language_instruction(self, lang: Optional[str]) -> str:
        lang = self._normalize_lang(lang)
        if lang == "ru":
            return "Ответь строго на русском языке."
        if lang == "en":
            return "Respond strictly in English."
        return "Тек қазақ тілінде жауап бер."

    def _chunk_text(self, text: str, *, max_chars: int, overlap: int = 800) -> list[str]:
        """
        Split long text into overlapping chunks (character-based).
        Keeps chunks reasonably aligned to paragraph boundaries when possible.
        """
        if not text:
            return []

        text = text.replace("\r\n", "\n")
        max_chars = max(2000, int(max_chars))
        overlap = max(0, int(overlap))
        if overlap >= max_chars:
            overlap = 0

        chunks: list[str] = []
        start = 0
        n = len(text)

        while start < n:
            end = min(n, start + max_chars)
            chunk = text[start:end]

            # If not last chunk, try to cut on a paragraph boundary near the end
            if end < n:
                search_from = max(0, len(chunk) - 2500)
                cut = chunk.rfind("\n\n", search_from)
                if cut > 0 and cut > len(chunk) * 0.5:
                    end = start + cut
                    chunk = text[start:end]

            chunk = chunk.strip()
            if chunk:
                chunks.append(chunk)

            if end >= n:
                break

            start = max(0, end - overlap)

        return chunks

    def _cache_key(self, material: str, target_chars: int, lang: Optional[str]) -> str:
        digest = hashlib.sha256(material.encode("utf-8")).hexdigest()
        lang_norm = self._normalize_lang(lang)
        return f"{digest}:{target_chars}:{lang_norm}:{'sum' if self.summarize_large else 'trunc'}"

    def _cache_get(self, key: str) -> Optional[str]:
        if self.summary_cache_max <= 0:
            return None
        if key not in self._summary_cache:
            return None
        value = self._summary_cache.pop(key)
        self._summary_cache[key] = value
        return value

    def _cache_set(self, key: str, value: str) -> None:
        if self.summary_cache_max <= 0:
            return
        if key in self._summary_cache:
            self._summary_cache.pop(key)
        self._summary_cache[key] = value
        while len(self._summary_cache) > self.summary_cache_max:
            self._summary_cache.popitem(last=False)

    def _prepare_large_material(self, material: str, *, target_chars: int, lang: Optional[str] = None) -> str:
        """
        For very large PDFs/text, build dense study notes via map-reduce summarization
        so we can still generate strong questions without blunt truncation.
        """
        if not material or len(material) <= target_chars:
            return material

        cache_key = self._cache_key(material, target_chars, lang)
        cached = self._cache_get(cache_key)
        if cached:
            return cached

        if not self.summarize_large:
            truncated = material[:target_chars] + "\n\n[Материал қысқартылды (өте үлкен мәтін)]"
            self._cache_set(cache_key, truncated)
            return truncated

        # Cap number of model calls: we must ensure we don't create hundreds of chunks for big PDFs.
        max_chunks = self.max_chunks
        # Choose chunk size so we end up with ~max_chunks chunks (bounded).
        max_chars = int(math.ceil(len(material) / max_chunks))
        # Keep chunks within reasonable size so Gemini stays stable.
        max_chars = max(self.min_chunk_chars, min(self.max_chunk_chars, max_chars))
        chunks = self._chunk_text(material, max_chars=max_chars, overlap=1200)

        # Hard cap in case of pathological input
        if len(chunks) > max_chunks:
            chunks = chunks[:max_chunks]

        # If chunking didn't help, fall back to a soft truncate with a warning marker
        if len(chunks) <= 1:
            truncated = material[:target_chars] + "\n\n[Материал қысқартылды (өте үлкен мәтін)]"
            self._cache_set(cache_key, truncated)
            return truncated

        notes_parts: list[str] = []

        for idx, chunk in enumerate(chunks, start=1):
            lang_instruction = self._language_instruction(lang)
            prompt = f"""{self.system_prompt}
{lang_instruction}

ТАПСЫРМА: Төмендегі мәтіннің {idx}/{len(chunks)} БӨЛІГІ бойынша өте тығыз, нақты оқу-конспект жаса.
Тек берілген материалдағы фактілерді пайдалан. Егер мәтінде [PAGE N] маркерлері болса, маңызды фактілердің қасына сақта (мысалы: "(PAGE 12)").

ҚҰРЫЛЫМ (қысқа әрі нақты):
- Key facts (bullets)
- Key terms (bullets)
- Timeline (bullets with year/date where possible)
- Potential ENT traps (bullets: шатастыратын, бірақ дәл фактіге негізделген тұстар)

МӘТІН:
{chunk}

КОНСПЕКТ:"""

            part = self._generate_with_retry(prompt).strip()
            if part:
                notes_parts.append(part)

        combined_notes = "\n\n---\n\n".join(notes_parts)

        if len(combined_notes) <= target_chars:
            self._cache_set(cache_key, combined_notes)
            return combined_notes

        # Reduce step: compress the combined notes to a single compact context
        lang_instruction = self._language_instruction(lang)
        reduce_prompt = f"""{self.system_prompt}
{lang_instruction}

ТАПСЫРМА: Төмендегі бірнеше бөлімнен тұратын конспектті бір ТҰТАС, өте ықшам оқу-материалына қысқарт.
Ереже: тек фактілер, артық сөз жоқ. [PAGE N] маркерлері болса, сақта.

Мақсат: нәтиже ұзындығы шамамен {target_chars} таңбадан аспасын.

КОНСПЕКТ:
{combined_notes}

ЫҚШАМ НӘТИЖЕ:"""

        reduced = self._generate_with_retry(reduce_prompt).strip()
        self._cache_set(cache_key, reduced)
        return reduced

    def _clean_json_response(self, text: str) -> str:
        """Clean and extract JSON from response text"""
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Try to fix truncated JSON
        if text:
            # Count brackets to check if JSON is complete
            open_braces = text.count('{') - text.count('}')
            open_brackets = text.count('[') - text.count(']')
            
            # If JSON is truncated, try to close it
            if open_braces > 0 or open_brackets > 0:
                # Find last complete item and truncate there
                # Try to find last complete question or section
                
                # First, try to close any open strings
                quote_count = text.count('"') 
                if quote_count % 2 != 0:
                    # Find last quote and truncate after previous complete item
                    last_complete = text.rfind('},')
                    if last_complete == -1:
                        last_complete = text.rfind('}]')
                    if last_complete > 0:
                        text = text[:last_complete+1]
                
                # Close remaining brackets
                open_braces = text.count('{') - text.count('}')
                open_brackets = text.count('[') - text.count(']')
                
                text += ']' * open_brackets
                text += '}' * open_braces
        
        return text
    
    def _generate_with_retry(self, prompt: str) -> str:
        """Generate content with retry logic for timeouts"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                # Retry on timeout or server errors
                if 'timeout' in error_str or '504' in error_str or '503' in error_str or '500' in error_str:
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay * (attempt + 1))
                        continue
                
                # Don't retry on other errors
                raise
        
        raise last_error

    async def generate_learn_content(self, material: str, history_mode: bool = False, lang: Optional[str] = None) -> dict:
        """
        Generate learning plan with content and questions for each section.
        
        Args:
            material: Source material text
            history_mode: If True, use 3-view format (general, summary, timeline)
        """
        # For large PDFs/text: summarize instead of hard truncation
        target_chars = 70000 if history_mode else 50000
        material = self._prepare_large_material(material, target_chars=target_chars, lang=lang)
        lang_instruction = self._language_instruction(lang)
        
        if history_mode:
            # History Mode - detailed 3-view format
            prompt = f"""Сен - тарих оқытушы AI. Тек берілген материалды пайдалан.
{lang_instruction}

ТАПСЫРМА: Материалды 3-5 тарихи бөлімге бөл. Әр бөлімге 3 ТОЛЫҚ көрініс жаса:

1) "general" - ТОЛЫҚ БАЯНДАУ:
- Тарихи оқиғаларды толық сипатта
- Себептерін, барысын, нәтижелерін жаз
- Тарихи тұлғалар туралы мәлімет бер
- 5-10 сөйлем болсын

2) "summary" - КОНСПЕКТ:
- Негізгі фактілер тізімі
- Есімдер, орындар, оқиғалар
- 5-8 пункт болсын

3) "timeline" - ХРОНОЛОГИЯ (МАҢЫЗДЫ!):
- Жыл нақты көрсетілсін
- Әр жылға ТОЛЫҚ оқиға сипаттамасы
- Барлық күндерді қамту
- Формат: [{{"period": "1465 жыл", "event": "Керей мен Жәнібек сұлтандар Әбілқайыр ханның қол астынан кетіп, Қазақ хандығын құрды. Олар Моғолстанның батыс бөлігіне - Жетісу өңіріне қоныс аударды."}}]

Әр бөлімге 3 ЕНТ деңгейіндегі сұрақ құр.

JSON ФОРМАТ:
{{
  "plan": [
    {{
      "title": "Бөлім атауы",
      "content": {{
        "general": "Толық тарихи баяндау...",
        "summary": ["Факт 1", "Факт 2", "Факт 3", "Факт 4", "Факт 5"],
        "timeline": [
          {{"period": "1465 жыл", "event": "Толық оқиға сипаттамасы..."}},
          {{"period": "1480 жыл", "event": "Келесі маңызды оқиға..."}}
        ]
      }},
      "questions": [
        {{"question": "Сұрақ?", "correct": "Дұрыс жауап", "wrong": ["Қате 1", "Қате 2", "Қате 3"], "explanation": "Түсіндірме"}}
      ]
    }}
  ]
}}

МАТЕРИАЛ:
{material}

JSON:"""
        else:
            # Normal Mode - simple format
            prompt = f"""Сен - оқу AI. Тек берілген материалды пайдалан.
{lang_instruction}

ТАПСЫРМА: Материалды 2-4 бөлімге бөл. Әр бөлімге:
- content: оқу материалы (type: text/list/table)
- questions: 3 сұрақ

JSON:
{{
  "plan": [
    {{
      "title": "Бөлім атауы",
      "content": {{
        "type": "text",
        "data": "Оқу материалы мәтіні..."
      }},
      "questions": [
        {{"question": "Сұрақ?", "correct": "Дұрыс жауап", "wrong": ["Қате 1", "Қате 2", "Қате 3"], "explanation": "Түсіндірме"}}
      ]
    }}
  ]
}}

МАТЕРИАЛ:
{material}

JSON:"""

        try:
            response_text = self._generate_with_retry(prompt)
            json_text = self._clean_json_response(response_text)
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise Exception(f"JSON форматында қате: {str(e)}")
        except Exception as e:
            raise Exception(f"Gemini API қатесі: {str(e)}")

    async def generate_practice_questions(self, material: str, count: int, exclude_questions: list = None, lang: Optional[str] = None) -> dict:
        """
        Generate practice questions.
        
        Args:
            material: Source material text
            count: Number of questions to generate
            exclude_questions: List of questions to exclude (for "continue with other questions")
            
        Returns:
            Dictionary with questions
        """
        # For large PDFs/text: summarize instead of hard truncation
        material = self._prepare_large_material(material, target_chars=50000, lang=lang)
        lang_instruction = self._language_instruction(lang)

        exclude_text = ""
        if exclude_questions:
            exclude_text = f"\n\nБҰЛ СҰРАҚТАРДЫ ҚАЙТАЛАМА:\n" + "\n".join(exclude_questions)

        prompt = f"""{self.system_prompt}
{lang_instruction}

ТАПСЫРМА: Материал бойынша {count} практика сұрақтарын құр.

ФОРМАТ (JSON):
{{
  "questions": [
    {{
      "id": 1,
      "question": "Сұрақ мәтіні",
      "correct": "Дұрыс жауап",
      "wrong": ["Қате жауап 1", "Қате жауап 2", "Қате жауап 3"],
      "explanation": "Түсіндірме (неге бұл жауап дұрыс)"
    }}
  ]
}}

ЕРЕЖЕЛЕР:
- Нақты {count} сұрақ құр
- Қате жауаптар шатастыратын болсын (ЕНТ стилінде)
- Қате жауаптардың ұзындығы дұрыс жауаппен шамалас болсын (өте қысқа немесе өте ұзын болмасын)
- Әр сұраққа түсіндірме жаз
{exclude_text}

МАТЕРИАЛ:
{material}

JSON жауап:"""

        try:
            response_text = self._generate_with_retry(prompt)
            json_text = self._clean_json_response(response_text)
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise Exception(f"JSON форматында қате: {str(e)}")
        except Exception as e:
            raise Exception(f"Gemini API қатесі: {str(e)}")

    async def generate_realtest_questions(self, material: str, count: int, lang: Optional[str] = None) -> dict:
        """
        Generate real test questions (no explanations, no hints).
        
        Args:
            material: Source material text
            count: Number of questions to generate
            
        Returns:
            Dictionary with test questions
        """
        # For large PDFs/text: summarize instead of hard truncation
        material = self._prepare_large_material(material, target_chars=50000, lang=lang)
        lang_instruction = self._language_instruction(lang)

        prompt = f"""{self.system_prompt}
{lang_instruction}

ТАПСЫРМА: Материал бойынша {count} тест сұрақтарын құр (нақты ЕНТ форматында).

ФОРМАТ (JSON):
{{
  "questions": [
    {{
      "id": 1,
      "question": "Сұрақ мәтіні",
      "correct": "Дұрыс жауап",
      "wrong": ["Қате жауап 1", "Қате жауап 2", "Қате жауап 3"]
    }}
  ]
}}

ЕРЕЖЕЛЕР:
- Нақты {count} сұрақ құр
- Сұрақтар ЕНТ деңгейінде болсын (күрделі)
- Қате жауаптар өте шатастыратын болсын
- Қате жауаптардың ұзындығы дұрыс жауаппен шамалас болсын
- Тек материалдағы фактілерді пайдалан

МАТЕРИАЛ:
{material}

JSON жауап:"""

        try:
            response_text = self._generate_with_retry(prompt)
            json_text = self._clean_json_response(response_text)
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise Exception(f"JSON форматында қате: {str(e)}")
        except Exception as e:
            raise Exception(f"Gemini API қатесі: {str(e)}")


# Singleton instance
_gemini_service = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
