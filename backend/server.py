"""
Qlub Market Intelligence Dashboard - Backend
FastAPI service with:
- Simple gated-login authentication
- Voice of Customer (Gemini googleSearch grounding)
- Restaurant + Neighborhood datasets (LA)
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from pathlib import Path
from datetime import datetime, timezone
import os
import json
import logging
import uuid
import re

from google import genai
from google.genai import types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- Config ----------
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
QLUB_PASSWORD = os.environ["QLUB_LOGIN_PASSWORD"]
QLUB_EMAIL = os.environ.get("QLUB_LOGIN_EMAIL", "la@qlub.com")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ---------- Gemini client ----------
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# ---------- App ----------
app = FastAPI(title="Qlub Market Intelligence API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("qlub")


# ---------- Models ----------
class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: str


class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int


class PainPoint(BaseModel):
    label: str
    mentions: int
    severity: str  # "low" | "medium" | "high"
    quote: Optional[str] = None


class Citation(BaseModel):
    title: str
    uri: str
    snippet: Optional[str] = None


class VoCResult(BaseModel):
    id: str
    query: str
    restaurant: Optional[str] = None
    summary: str
    sentiment: SentimentBreakdown
    pain_points: List[PainPoint]
    opportunities: List[str]
    citations: List[Citation]
    generated_at: str
    raw_sources: int


class VoCRequest(BaseModel):
    restaurant: Optional[str] = None
    query: Optional[str] = None  # free-form query fallback


# ---------- Auth ----------
@api.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    # Email is optional for backward compat; if sent it must match
    if req.email and req.email.strip().lower() != QLUB_EMAIL.lower():
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if req.password != QLUB_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = f"qlub-{uuid.uuid4().hex}"
    return LoginResponse(token=token, expires_at=datetime.now(timezone.utc).isoformat())


# ---------- Restaurant / Neighborhood data ----------
LA_NEIGHBORHOODS = [
    {"name": "DTLA", "lat": 34.0407, "lng": -118.2468, "count": 9, "tier": "A"},
    {"name": "Arts District", "lat": 34.0411, "lng": -118.2345, "count": 7, "tier": "A"},
    {"name": "West Hollywood", "lat": 34.0900, "lng": -118.3617, "count": 8, "tier": "A"},
    {"name": "Beverly Hills", "lat": 34.0736, "lng": -118.4004, "count": 6, "tier": "A"},
    {"name": "Santa Monica", "lat": 34.0195, "lng": -118.4912, "count": 7, "tier": "A"},
    {"name": "Venice", "lat": 33.9850, "lng": -118.4695, "count": 5, "tier": "A"},
    {"name": "Silver Lake", "lat": 34.0869, "lng": -118.2702, "count": 5, "tier": "B"},
    {"name": "Echo Park", "lat": 34.0782, "lng": -118.2606, "count": 4, "tier": "B"},
    {"name": "Los Feliz", "lat": 34.1106, "lng": -118.2942, "count": 4, "tier": "B"},
    {"name": "Hollywood", "lat": 34.0928, "lng": -118.3287, "count": 6, "tier": "A"},
    {"name": "Koreatown", "lat": 34.0580, "lng": -118.3000, "count": 5, "tier": "B"},
    {"name": "Mid-Wilshire", "lat": 34.0620, "lng": -118.3500, "count": 4, "tier": "B"},
    {"name": "Culver City", "lat": 34.0211, "lng": -118.3965, "count": 4, "tier": "B"},
    {"name": "Pasadena", "lat": 34.1478, "lng": -118.1445, "count": 5, "tier": "B"},
    {"name": "Highland Park", "lat": 34.1138, "lng": -118.1928, "count": 3, "tier": "C"},
    {"name": "Glendale", "lat": 34.1425, "lng": -118.2551, "count": 3, "tier": "C"},
    {"name": "Atwater Village", "lat": 34.1181, "lng": -118.2605, "count": 2, "tier": "C"},
    {"name": "Venice Beach", "lat": 33.9900, "lng": -118.4730, "count": 3, "tier": "B"},
    {"name": "Malibu", "lat": 34.0259, "lng": -118.7798, "count": 3, "tier": "A"},
    {"name": "Brentwood", "lat": 34.0520, "lng": -118.4740, "count": 2, "tier": "B"},
    {"name": "West Adams", "lat": 34.0346, "lng": -118.3240, "count": 2, "tier": "C"},
    {"name": "Chinatown", "lat": 34.0638, "lng": -118.2380, "count": 2, "tier": "C"},
    {"name": "Little Tokyo", "lat": 34.0500, "lng": -118.2400, "count": 2, "tier": "C"},
]


def _restaurant(name, neighborhood, cuisine, owner, valuation, pos, price, rating, investment):
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name,
        "neighborhood": neighborhood,
        "cuisine": cuisine,
        "owner": owner,
        "valuation": valuation,
        "pos": pos,
        "price": price,
        "rating": rating,
        "investment": investment,
    }


RESTAURANTS = [
    _restaurant("Bestia", "Arts District", "Italian", "Ori Menashe & Genevieve Gergis", "$25M+", "Toast", "$$$", 4.7, "High"),
    _restaurant("Bavel", "Arts District", "Middle Eastern", "Ori Menashe & Genevieve Gergis", "$18M+", "Toast", "$$$", 4.7, "High"),
    _restaurant("Republique", "Mid-Wilshire", "French / Bakery", "Walter & Margarita Manzke", "$15M+", "Micros", "$$", 4.5, "High"),
    _restaurant("Felix Trattoria", "Venice", "Italian", "Evan Funke", "$12M+", "Toast", "$$$", 4.6, "High"),
    _restaurant("Gjelina", "Venice", "New American", "Fran Camaj", "$14M+", "Micros", "$$$", 4.5, "High"),
    _restaurant("Gjusta", "Venice", "Bakery / Deli", "Fran Camaj", "$10M+", "Square", "$$", 4.4, "Medium"),
    _restaurant("Providence", "Hollywood", "Seafood / Tasting", "Michael Cimarusti", "$20M+", "Micros", "$$$$", 4.8, "High"),
    _restaurant("n/naka", "Palms", "Japanese Kaiseki", "Niki Nakayama", "$8M+", "Toast", "$$$$", 4.9, "High"),
    _restaurant("Horses", "Hollywood", "New American", "Liz Johnson & Will Aghajanian", "$9M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Mother Wolf", "Hollywood", "Italian", "Evan Funke", "$22M+", "Toast", "$$$$", 4.6, "High"),
    _restaurant("Majordomo", "Chinatown", "Asian American", "David Chang", "$16M+", "Toast", "$$$", 4.4, "High"),
    _restaurant("Kato", "DTLA", "Taiwanese Tasting", "Jon Yao", "$11M+", "Toast", "$$$$", 4.8, "High"),
    _restaurant("Spago", "Beverly Hills", "California", "Wolfgang Puck", "$30M+", "Micros", "$$$$", 4.6, "High"),
    _restaurant("Nobu Malibu", "Malibu", "Japanese", "Nobu Matsuhisa", "$40M+", "Micros", "$$$$", 4.5, "High"),
    _restaurant("Matsuhisa", "Beverly Hills", "Japanese", "Nobu Matsuhisa", "$22M+", "Micros", "$$$$", 4.5, "High"),
    _restaurant("Catch LA", "West Hollywood", "Seafood", "Hospitality Corp", "$28M+", "Micros", "$$$$", 4.3, "High"),
    _restaurant("The Nice Guy", "West Hollywood", "Italian / Lounge", "H.Wood Group", "$18M+", "Micros", "$$$", 4.2, "Medium"),
    _restaurant("Delilah", "West Hollywood", "American / Lounge", "H.Wood Group", "$20M+", "Micros", "$$$$", 4.3, "High"),
    _restaurant("Craig's", "West Hollywood", "American", "Craig Susser", "$25M+", "Micros", "$$$$", 4.4, "High"),
    _restaurant("The Ivy", "Beverly Hills", "California", "Lynn von Kersting", "$15M+", "Aloha", "$$$$", 4.1, "Medium"),
    _restaurant("Cecconi's", "West Hollywood", "Italian", "Soho House", "$20M+", "Micros", "$$$$", 4.3, "High"),
    _restaurant("Soho House WeHo", "West Hollywood", "Private Club", "Soho House", "$50M+", "Micros", "$$$$", 4.4, "High"),
    _restaurant("Elephante", "Santa Monica", "Italian / Rooftop", "H.Wood Group", "$17M+", "Toast", "$$$", 4.3, "High"),
    _restaurant("Giorgio Baldi", "Santa Monica", "Italian", "Giorgio Baldi", "$14M+", "Micros", "$$$$", 4.5, "High"),
    _restaurant("Forma", "Santa Monica", "Italian", "Piero Topputo", "$6M+", "Toast", "$$$", 4.4, "Medium"),
    _restaurant("Vespertine", "Culver City", "Experimental", "Jordan Kahn", "$9M+", "Toast", "$$$$", 4.4, "Medium"),
    _restaurant("Destroyer", "Culver City", "Nordic Modern", "Jordan Kahn", "$4M+", "Square", "$$", 4.3, "Low"),
    _restaurant("Sqirl", "Silver Lake", "Breakfast / Brunch", "Jessica Koslow", "$5M+", "Square", "$$", 4.2, "Low"),
    _restaurant("Pine & Crane", "Silver Lake", "Taiwanese", "Vivian Ku", "$4M+", "Toast", "$$", 4.4, "Low"),
    _restaurant("Night + Market", "Silver Lake", "Thai", "Kris Yenbamroong", "$5M+", "Toast", "$$", 4.4, "Medium"),
    _restaurant("Kismet", "Los Feliz", "Middle Eastern", "Sara Kramer & Sarah Hymanson", "$6M+", "Toast", "$$", 4.3, "Medium"),
    _restaurant("All Day Baby", "Silver Lake", "Diner", "Lien Ta & Jonathan Whitener", "$3M+", "Square", "$$", 4.4, "Low"),
    _restaurant("HiHo Cheeseburger", "Santa Monica", "Burgers", "Jerry Greenberg", "$8M+", "Toast", "$$", 4.5, "Medium"),
    _restaurant("Guelaguetza", "Koreatown", "Oaxacan", "Lopez Family", "$7M+", "Aloha", "$$", 4.6, "Medium"),
    _restaurant("Here's Looking At You", "Koreatown", "New American", "Lien Ta & Jonathan Whitener", "$5M+", "Toast", "$$$", 4.4, "Medium"),
    _restaurant("Quarter Sheets", "Echo Park", "Pizza / Cakes", "Aaron Lindell & Hannah Ziskin", "$3M+", "Square", "$$", 4.5, "Low"),
    _restaurant("Holbox", "South LA", "Mexican Seafood", "Gilberto Cetina", "$4M+", "Toast", "$$", 4.7, "Medium"),
    _restaurant("Anajak Thai", "Sherman Oaks", "Thai", "Justin Pichetrungsi", "$5M+", "Toast", "$$", 4.6, "Medium"),
    _restaurant("Yangban", "Arts District", "Korean American", "John & Katianna Hong", "$6M+", "Toast", "$$$", 4.3, "Medium"),
    _restaurant("Camphor", "Arts District", "French Indian", "Max Boonthanakit & Lijo George", "$5M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Damian", "Arts District", "Mexican", "Enrique Olvera", "$10M+", "Toast", "$$$", 4.4, "High"),
    _restaurant("Ditroit", "Arts District", "Taqueria", "Enrique Olvera", "$3M+", "Square", "$$", 4.5, "Low"),
    _restaurant("Manuela", "Arts District", "Southern American", "Hauser & Wirth", "$7M+", "Toast", "$$$", 4.3, "Medium"),
    _restaurant("Girl & The Goat", "Arts District", "New American", "Stephanie Izard", "$9M+", "Toast", "$$$", 4.3, "High"),
    _restaurant("Bacetti", "Echo Park", "Italian", "Shawn Pham", "$4M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Konbi", "Echo Park", "Japanese Sandwiches", "Akira Akuto & Nick Montgomery", "$3M+", "Square", "$$", 4.5, "Low"),
    _restaurant("Found Oyster", "East Hollywood", "Seafood", "Ari Kolender", "$5M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Ototo", "Echo Park", "Japanese / Sake", "Charles Namba & Courtney Kaplan", "$4M+", "Toast", "$$", 4.6, "Medium"),
    _restaurant("Tsubaki", "Echo Park", "Japanese", "Charles Namba & Courtney Kaplan", "$5M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Saffy's", "East Hollywood", "Middle Eastern", "Ori Menashe & Genevieve Gergis", "$6M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("Lowboy", "Highland Park", "Bar / Pub", "Abbey Sharp", "$2M+", "Square", "$$", 4.3, "Low"),
    _restaurant("Cento Pasta Bar", "DTLA", "Italian", "Avner Lavi", "$3M+", "Toast", "$$", 4.5, "Low"),
    _restaurant("Orsa & Winston", "DTLA", "Italian Japanese", "Josef Centeno", "$5M+", "Micros", "$$$$", 4.5, "Medium"),
    _restaurant("Baroo", "DTLA", "Korean", "Kwang Uh", "$4M+", "Toast", "$$$", 4.6, "Medium"),
    _restaurant("71Above", "DTLA", "American Fine Dining", "Emil Eyvazoff", "$12M+", "Micros", "$$$$", 4.4, "High"),
    _restaurant("Perch LA", "DTLA", "French / Rooftop", "Bradley Schulman", "$15M+", "Micros", "$$$", 4.2, "High"),
    _restaurant("Redbird", "DTLA", "New American", "Neal Fraser", "$10M+", "Toast", "$$$$", 4.4, "High"),
    _restaurant("Bottega Louie", "DTLA", "Italian / Bakery", "Scott Kim", "$25M+", "Micros", "$$$", 4.2, "High"),
    _restaurant("Maccheroni Republic", "DTLA", "Italian", "Gianfranco Minuz", "$4M+", "Square", "$$", 4.4, "Low"),
    _restaurant("Union Pasadena", "Pasadena", "Italian", "Bruce Kalman", "$5M+", "Toast", "$$$", 4.4, "Medium"),
    _restaurant("Bistro Na's", "San Gabriel", "Imperial Chinese", "Tony & Nancy Xu", "$6M+", "Toast", "$$$", 4.5, "Medium"),
    _restaurant("The Apple Pan", "West LA", "Burgers / Diner", "Sherri Gallagher", "$3M+", "Aloha", "$$", 4.3, "Low"),
    _restaurant("Tito's Tacos", "Culver City", "Mexican", "Lynne Nieto", "$5M+", "Aloha", "$", 4.3, "Medium"),
    _restaurant("Langer's Delicatessen", "Westlake", "Jewish Deli", "Norm Langer", "$7M+", "Aloha", "$$", 4.6, "Medium"),
    _restaurant("Phillippe The Original", "Chinatown", "American Deli", "Phillippe Family", "$8M+", "Aloha", "$$", 4.4, "Medium"),
]

# Attach an LA lat/lng hint using the neighborhood map
_NEIGH_INDEX = {n["name"]: n for n in LA_NEIGHBORHOODS}
for r in RESTAURANTS:
    n = _NEIGH_INDEX.get(r["neighborhood"])
    if n:
        r["lat"] = n["lat"]
        r["lng"] = n["lng"]
    else:
        r["lat"] = 34.05
        r["lng"] = -118.25


@api.get("/restaurants")
async def list_restaurants():
    return {"count": len(RESTAURANTS), "restaurants": RESTAURANTS}


@api.get("/neighborhoods")
async def list_neighborhoods():
    # Recompute live counts from actual restaurants
    counts = {}
    for r in RESTAURANTS:
        counts[r["neighborhood"]] = counts.get(r["neighborhood"], 0) + 1
    out = []
    for n in LA_NEIGHBORHOODS:
        n2 = dict(n)
        n2["count"] = counts.get(n["name"], n["count"])
        out.append(n2)
    return {"neighborhoods": out}


# ---------- Voice of Customer (Gemini googleSearch grounding) ----------
VOC_PROMPT = """You are a senior market-intelligence analyst for Qlub, an instant payment platform for restaurants.

TASK: Search Google/Yelp/Eater/Reddit/TripAdvisor for real, recent reviews and commentary about the target restaurant(s) below. Then produce a structured Voice-of-Customer report.

TARGET: {target}

OUTPUT RULES (STRICT):
Return ONLY a JSON object (no markdown, no prose, no code fences) with this EXACT schema:
{{
  "summary": "3-5 sentence executive summary of what customers say.",
  "sentiment": {{"positive": <int 0-100>, "neutral": <int 0-100>, "negative": <int 0-100>}},
  "pain_points": [
    {{"label": "Waiting for the bill", "mentions": <int>, "severity": "high|medium|low", "quote": "<short real review snippet>"}},
    {{"label": "POS friction / payment delays", "mentions": <int>, "severity": "high|medium|low", "quote": "..."}},
    {{"label": "Staff turnover / service inconsistency", "mentions": <int>, "severity": "high|medium|low", "quote": "..."}},
    {{"label": "Reservation / wait time", "mentions": <int>, "severity": "high|medium|low", "quote": "..."}},
    {{"label": "Price / value perception", "mentions": <int>, "severity": "high|medium|low", "quote": "..."}}
  ],
  "opportunities": ["short actionable insight for Qlub GTM", "...", "..."]
}}

WEIGHTING RULES:
- Heavily weight pain points related to: "waiting for the bill", "POS friction", "payment speed/friction", "staff turnover", "service inconsistency".
- Sentiment percentages MUST sum to 100.
- If search returns nothing useful, still return the JSON with best-effort inferred defaults and explain in `summary`.

Return ONLY the JSON. No markdown fences, no extra text."""


def _strip_code_fence(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    return s.strip()


def _extract_json(text: str):
    text = _strip_code_fence(text)
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    # Fallback: pull the first {...} block
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


VOC_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]


def _call_gemini_with_retry(prompt: str):
    """Try a sequence of models with backoff on 503 UNAVAILABLE or empty text."""
    import time
    last_err = None
    last_resp = None
    last_model = None
    for model in VOC_MODELS:
        for attempt in range(2):
            try:
                resp = gemini_client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        temperature=0.3,
                    ),
                )
                text = _response_text(resp)
                if not text.strip():
                    # Some models return empty text with grounding — cascade
                    log.warning("Gemini empty text model=%s attempt=%s", model, attempt)
                    last_resp = resp
                    last_model = model
                    time.sleep(0.6)
                    continue
                log.info("Gemini ok model=%s attempt=%s text_len=%d", model, attempt, len(text))
                return resp, model
            except Exception as e:
                msg = str(e)
                last_err = e
                log.warning("Gemini fail model=%s attempt=%s: %s", model, attempt, msg[:200])
                if "503" in msg or "UNAVAILABLE" in msg or "overload" in msg.lower() or "429" in msg:
                    time.sleep(1.2 * (attempt + 1))
                    continue
                raise
    # All models exhausted — as a last resort try ONE model WITHOUT grounding to at least get JSON
    try:
        log.info("VoC fallback: re-calling gemini-2.5-flash-lite WITHOUT grounding")
        resp = gemini_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt + "\n\n(Note: no web search available — use your best knowledge for this analysis.)",
            config=types.GenerateContentConfig(temperature=0.3),
        )
        text = _response_text(resp)
        if text.strip():
            return resp, "gemini-2.5-flash-lite (no-grounding)"
    except Exception as e:
        last_err = e
    # Return the last empty response for graceful degradation
    if last_resp is not None:
        return last_resp, last_model
    raise last_err if last_err else RuntimeError("Gemini unavailable")


def _response_text(response) -> str:
    """Extract concatenated text from a GenerateContentResponse. Handles the case
    where `.text` is empty when grounding is used."""
    # Try the shortcut first
    try:
        t = response.text or ""
        if t.strip():
            return t
    except Exception:
        pass
    # Walk candidates/parts
    chunks = []
    try:
        for cand in response.candidates or []:
            content = getattr(cand, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", None) or []:
                pt = getattr(part, "text", None)
                if pt:
                    chunks.append(pt)
    except Exception:
        pass
    return "\n".join(chunks)


@api.post("/voice-of-customer/sync", response_model=VoCResult)
async def voc_sync(req: VoCRequest):
    target = req.restaurant or req.query or "top Los Angeles restaurants (DTLA, Arts District, West Hollywood, Santa Monica, Venice)"
    prompt = VOC_PROMPT.format(target=target)

    try:
        response, model_used = _call_gemini_with_retry(prompt)
    except Exception as e:
        log.exception("Gemini call failed after retries")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")

    raw_text = _response_text(response).strip()
    log.info("VoC raw_text length=%d model=%s", len(raw_text), model_used)
    data = _extract_json(raw_text)

    # Citations from grounding metadata
    citations: List[Citation] = []
    try:
        for cand in response.candidates or []:
            gm = getattr(cand, "grounding_metadata", None)
            if not gm:
                continue
            chunks = getattr(gm, "grounding_chunks", None) or []
            for ch in chunks:
                web = getattr(ch, "web", None)
                if web:
                    citations.append(Citation(
                        title=getattr(web, "title", "") or "source",
                        uri=getattr(web, "uri", "") or "",
                    ))
    except Exception:
        pass

    if not data:
        # Graceful fallback if model returned no JSON
        data = {
            "summary": raw_text[:600] or "No structured data returned.",
            "sentiment": {"positive": 55, "neutral": 25, "negative": 20},
            "pain_points": [
                {"label": "Waiting for the bill", "mentions": 0, "severity": "medium", "quote": ""},
                {"label": "POS friction / payment delays", "mentions": 0, "severity": "medium", "quote": ""},
                {"label": "Staff turnover / service inconsistency", "mentions": 0, "severity": "low", "quote": ""},
            ],
            "opportunities": [],
        }

    # Normalize sentiment to sum=100
    s = data.get("sentiment") or {}
    pos = int(s.get("positive", 0) or 0)
    neu = int(s.get("neutral", 0) or 0)
    neg = int(s.get("negative", 0) or 0)
    total = pos + neu + neg
    if total == 0:
        pos, neu, neg = 55, 25, 20
    else:
        pos = round(pos * 100 / total)
        neu = round(neu * 100 / total)
        neg = max(0, 100 - pos - neu)

    # Weight Qlub-specific pain points: boost severity if label matches
    qlub_keywords = [
        ("waiting for", "bill"),
        ("pos",),
        ("payment",),
        ("staff turnover",),
        ("service inconsist",),
    ]
    weighted = []
    for pp in (data.get("pain_points") or [])[:8]:
        label = (pp.get("label") or "").lower()
        severity = (pp.get("severity") or "medium").lower()
        for kws in qlub_keywords:
            if all(k in label for k in kws):
                # bump severity up one tier
                if severity == "low":
                    severity = "medium"
                elif severity == "medium":
                    severity = "high"
                break
        weighted.append(PainPoint(
            label=pp.get("label", "Unknown"),
            mentions=int(pp.get("mentions") or 0),
            severity=severity,
            quote=pp.get("quote") or None,
        ))

    result = VoCResult(
        id=str(uuid.uuid4()),
        query=req.query or target,
        restaurant=req.restaurant,
        summary=data.get("summary", "")[:2000],
        sentiment=SentimentBreakdown(positive=pos, neutral=neu, negative=neg),
        pain_points=weighted,
        opportunities=(data.get("opportunities") or [])[:6],
        citations=citations[:12],
        generated_at=datetime.now(timezone.utc).isoformat(),
        raw_sources=len(citations),
    )

    # Persist for history (fire-and-forget)
    try:
        doc = result.model_dump()
        await db.voc_history.insert_one(doc)
    except Exception:
        log.warning("Failed to persist VoC result", exc_info=True)

    return result


@api.get("/voice-of-customer/history")
async def voc_history(limit: int = 10):
    docs = await db.voc_history.find({}, {"_id": 0}).sort("generated_at", -1).to_list(limit)
    return {"items": docs}


class OutreachRequest(BaseModel):
    restaurant: str
    pain_points: Optional[List[str]] = None
    tone: Optional[str] = "confident-friendly"  # "confident-friendly" | "direct" | "warm"


class OutreachResponse(BaseModel):
    subject: str
    email: str
    generated_at: str


@api.post("/outreach/generate", response_model=OutreachResponse)
async def generate_outreach(req: OutreachRequest):
    # Find the restaurant record for firmographics
    match = next((r for r in RESTAURANTS if r["name"].lower() == req.restaurant.lower()), None)
    firmo = ""
    if match:
        firmo = (
            f"Name: {match['name']}\n"
            f"Owner/Chef: {match['owner']}\n"
            f"Neighborhood: {match['neighborhood']}\n"
            f"Cuisine: {match['cuisine']}\n"
            f"POS: {match['pos']}\n"
            f"Valuation: {match['valuation']}\n"
        )
    pain_str = "\n- " + "\n- ".join(req.pain_points) if req.pain_points else ""
    prompt = f"""You are writing a concise outbound sales email for Qlub — an instant, app-free restaurant bill-pay product. The goal is to book a 15-minute call with the GM/owner.

TARGET RESTAURANT (firmographics):
{firmo or req.restaurant}

OBSERVED PAIN POINTS FROM CUSTOMER REVIEWS:{pain_str or ' (not provided — write a strong generic pitch grounded in LA restaurant reality)'}

WRITE:
1) A crisp subject line (max 9 words, no emojis, no clickbait).
2) An email body (max 120 words) that:
   - Opens with a specific, warm hook tied to the restaurant's brand (name, chef, neighborhood, a dish or vibe if you know it).
   - Calls out ONE specific pain point (prefer bill-wait / POS friction / split-check friction) and quantifies the cost.
   - Proposes Qlub's wedge in 1 sentence (guest pays instantly from their phone — no app, no waiter, no wallet).
   - Ends with a soft CTA: "15 min next Tues?"
   - Tone: {req.tone}. Human, confident, no corporate jargon.

OUTPUT STRICTLY AS JSON:
{{"subject": "...", "email": "..."}}
No markdown, no code fences, no prose outside the JSON.
"""

    # Use the same retry cascade. No grounding needed for this.
    import time
    last_err = None
    text = ""
    for model in ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]:
        for attempt in range(2):
            try:
                resp = gemini_client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.8),
                )
                text = _response_text(resp).strip()
                if text:
                    break
            except Exception as e:
                last_err = e
                msg = str(e)
                if "503" in msg or "UNAVAILABLE" in msg or "429" in msg or "overload" in msg.lower():
                    time.sleep(1.0 * (attempt + 1))
                    continue
                raise HTTPException(status_code=502, detail=f"Gemini: {msg[:200]}")
        if text:
            break
    if not text:
        raise HTTPException(status_code=502, detail=f"Gemini unavailable: {last_err}")

    data = _extract_json(text) or {}
    subject = (data.get("subject") or "").strip() or f"A faster close-out for {req.restaurant}"
    email = (data.get("email") or text).strip()
    return OutreachResponse(
        subject=subject[:200],
        email=email[:2000],
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@api.get("/health")
async def health():
    return {"status": "ok", "service": "qlub-api"}


# ---------- Static real-data (VoC + Expo) ----------
_DATA_DIR = Path(__file__).parent / "data"

def _load_json(fname: str) -> dict:
    path = _DATA_DIR / fname
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)

# Loaded once at startup
VOC_RAW = _load_json("voc_dataset.json")
NOPOS_RAW = _load_json("no_pos_segment.json")

REGION_MAP = {
    "DTLA": "DTLA & Downtown",
    "Arts District": "DTLA & Downtown",
    "Chinatown": "DTLA & Downtown",
    "Little Tokyo": "DTLA & Downtown",
    "Venice": "Westside",
    "Santa Monica": "Westside",
    "Malibu": "Westside",
    "Culver City": "Westside",
    "Brentwood": "Westside",
    "West LA": "Westside",
    "Palms": "Westside",
    "Hollywood": "Hollywood",
    "West Hollywood": "Hollywood",
    "East Hollywood": "Hollywood",
    "Beverly Hills": "Midtown & Wilshire",
    "Mid-Wilshire": "Midtown & Wilshire",
    "Koreatown": "Midtown & Wilshire",
    "West Adams": "Midtown & Wilshire",
    "Westlake": "Midtown & Wilshire",
    "Silver Lake": "Eastside",
    "Los Feliz": "Eastside",
    "Echo Park": "Eastside",
    "Highland Park": "Eastside",
    "Atwater Village": "Eastside",
    "Cypress Park": "Eastside",
    "Boyle Heights": "Eastside",
    "South LA": "South & Other",
    "Sherman Oaks": "Valley & Pasadena",
    "Pasadena": "Valley & Pasadena",
    "San Gabriel": "Valley & Pasadena",
    "Glendale": "Valley & Pasadena",
    "Mobile": "Mobile & Pop-up",
}


def _region_of(neighborhood: str) -> str:
    return REGION_MAP.get(neighborhood, "Other")


def _prospect_rows():
    """Flatten VOC dataset into clean rows for the Expo."""
    # Lookup valuation from the curated RESTAURANTS list (public revenue estimates)
    val_by_name = {r["name"].lower(): r.get("valuation") for r in RESTAURANTS}
    out = []
    for r in VOC_RAW.get("restaurants", []):
        pos = (r.get("data") or {}).get("pos") or {}
        verified = (pos.get("confidence") in ("high", "medium")) and pos.get("system") and pos.get("system") != "Unknown"
        out.append({
            "id": r["id"],
            "name": r["name"],
            "neighborhood": r["neighborhood"],
            "region": _region_of(r["neighborhood"]),
            "cuisine": r["cuisine"],
            "segment": "prospect",
            "valuation": val_by_name.get(r["name"].lower()),
            "pos_system": pos.get("system") if verified else None,
            "pos_confidence": pos.get("confidence") or "none",
            "pos_verified": verified,
            "pos_evidence_url": pos.get("evidence_url"),
            "pos_evidence_quote": pos.get("evidence_quote"),
            "review_count": len((r.get("data") or {}).get("reviews") or []),
        })
    return out


def _nopos_rows():
    out = []
    for r in NOPOS_RAW.get("restaurants", []):
        out.append({
            "id": r["id"],
            "name": r["name"],
            "neighborhood": r["neighborhood"],
            "region": _region_of(r["neighborhood"]),
            "cuisine": r["cuisine"],
            "segment": "no_modern_pos",
            "valuation": None,
            "pos_system": None,
            "pos_confidence": "none",
            "pos_verified": False,
            "pos_evidence_url": None,
            "pos_evidence_quote": None,
            "review_count": 0,
        })
    return out


@api.get("/expo/restaurants")
async def expo_restaurants():
    prospects = _prospect_rows()
    nopos = _nopos_rows()
    verified_count = sum(1 for p in prospects if p["pos_verified"])
    return {
        "source": {
            "method": "Gemini 2.5 googleSearch grounding",
            "scope": "Real-Los-Angeles public web data — Google, Yelp, Eater, Reddit, TripAdvisor",
            "pulled_at": VOC_RAW.get("fetched_at"),
            "prospects_total": len(prospects),
            "prospects_pos_verified": verified_count,
            "no_modern_pos_total": len(nopos),
            "disclaimer": (
                "POS system is shown ONLY when a real public citation was found. "
                "Otherwise it reads 'POS not detected' — no guesses."
            ),
            "prospect_logic": (
                "A venue is a 'Qlub Prospect' when it meets ALL three: "
                "(1) it's a sit-down / full-service restaurant (Qlub is pay-at-table), "
                "(2) it runs a modern POS that exposes an integration (Toast, Micros, Square, Clover, Aloha, TouchBistro) "
                "OR the POS is unverified but the venue format fits (so the SDR can verify in a 2-minute call), "
                "(3) public reviews show at least one close-out / billing / wait-time pain point — "
                "the exact friction Qlub removes. Cash-only / food-truck / pop-up venues are marked 'Anti-Segment' "
                "because there is no POS to integrate with."
            ),
        },
        "restaurants": prospects + nopos,
    }


@api.get("/voc-static/filters")
async def voc_filters():
    prospects = _prospect_rows()
    # Only show restaurants that actually have quotes so filters never resolve to zero
    prospects = [p for p in prospects if p.get("review_count", 0) > 0]
    # Group restaurants by region
    by_region = {}
    for p in prospects:
        by_region.setdefault(p["region"], []).append({"id": p["id"], "name": p["name"], "neighborhood": p["neighborhood"]})
    regions = [{"region": k, "count": len(v), "restaurants": sorted(v, key=lambda x: x["name"])} for k, v in sorted(by_region.items())]
    issues = [
        {"id": "pos", "label": "POS Friction", "desc": "Crashes, slowness, split-check failures"},
        {"id": "wait_time", "label": "Wait Time", "desc": "Slow bill close-out, check wait"},
        {"id": "billing", "label": "Billing Issues", "desc": "Wrong charges, auto-grat disputes"},
        {"id": "tipping", "label": "Tipping Friction", "desc": "Tip prompt confusion, tip on tax"},
    ]
    return {"regions": regions, "issues": issues}


@api.get("/voc-static/reviews")
async def voc_reviews(location: Optional[str] = None, restaurant_id: Optional[str] = None, issue: Optional[str] = None):
    out = []
    for r in VOC_RAW.get("restaurants", []):
        if restaurant_id and r["id"] != restaurant_id:
            continue
        if location and _region_of(r["neighborhood"]) != location:
            continue
        for rv in (r.get("data") or {}).get("reviews") or []:
            if issue and rv.get("issue") != issue:
                continue
            out.append({
                "restaurant_id": r["id"],
                "restaurant_name": r["name"],
                "neighborhood": r["neighborhood"],
                "region": _region_of(r["neighborhood"]),
                "issue": rv.get("issue"),
                "quote": rv.get("quote"),
                "source": rv.get("source"),
                "source_url": rv.get("source_url"),
                "date": rv.get("date"),
            })
    return {"count": len(out), "reviews": out}


@api.get("/voc-static/restaurant/{restaurant_id}")
async def voc_restaurant_detail(restaurant_id: str):
    for r in VOC_RAW.get("restaurants", []):
        if r["id"] == restaurant_id:
            data = r.get("data") or {}
            return {
                "id": r["id"],
                "name": r["name"],
                "neighborhood": r["neighborhood"],
                "region": _region_of(r["neighborhood"]),
                "cuisine": r["cuisine"],
                "pos": data.get("pos") or {},
                "reviews": data.get("reviews") or [],
                "notes": data.get("notes"),
            }
    raise HTTPException(status_code=404, detail="Restaurant not found")


# ---------- Wire up ----------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    mongo_client.close()
