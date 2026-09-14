"""
Build the static VoC + POS-verification dataset via Gemini googleSearch grounding.
Runs OFFLINE. Output: /app/backend/data/voc_dataset.json + pos_verification.json.

The frontend never calls Gemini for this data — it reads the baked JSON.
Only the per-click "Generate Outreach" endpoint uses Gemini live.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
client = genai.Client(api_key=GEMINI_API_KEY)

# ---------- Target list ----------
# These are REAL LA prospect restaurants (full-service, modern-POS candidates).
# Qlub is a pay-at-table product → we focus on sit-down, group-dining venues.
PROSPECTS: List[Dict[str, Any]] = [
    {"id": "bestia", "name": "Bestia", "neighborhood": "Arts District", "cuisine": "Italian"},
    {"id": "bavel", "name": "Bavel", "neighborhood": "Arts District", "cuisine": "Middle Eastern"},
    {"id": "republique", "name": "République", "neighborhood": "Mid-Wilshire", "cuisine": "French"},
    {"id": "felix-trattoria", "name": "Felix Trattoria", "neighborhood": "Venice", "cuisine": "Italian"},
    {"id": "gjelina", "name": "Gjelina", "neighborhood": "Venice", "cuisine": "New American"},
    {"id": "providence", "name": "Providence", "neighborhood": "Hollywood", "cuisine": "Seafood"},
    {"id": "mother-wolf", "name": "Mother Wolf", "neighborhood": "Hollywood", "cuisine": "Italian"},
    {"id": "horses", "name": "Horses", "neighborhood": "Hollywood", "cuisine": "New American"},
    {"id": "majordomo", "name": "Majordomo", "neighborhood": "Chinatown", "cuisine": "Asian American"},
    {"id": "kato", "name": "Kato", "neighborhood": "DTLA", "cuisine": "Taiwanese"},
    {"id": "spago", "name": "Spago", "neighborhood": "Beverly Hills", "cuisine": "California"},
    {"id": "nobu-malibu", "name": "Nobu Malibu", "neighborhood": "Malibu", "cuisine": "Japanese"},
    {"id": "catch-la", "name": "Catch LA", "neighborhood": "West Hollywood", "cuisine": "Seafood"},
    {"id": "delilah", "name": "Delilah", "neighborhood": "West Hollywood", "cuisine": "American"},
    {"id": "craigs", "name": "Craig's", "neighborhood": "West Hollywood", "cuisine": "American"},
    {"id": "elephante", "name": "Elephante", "neighborhood": "Santa Monica", "cuisine": "Italian"},
    {"id": "giorgio-baldi", "name": "Giorgio Baldi", "neighborhood": "Santa Monica", "cuisine": "Italian"},
    {"id": "night-market", "name": "Night + Market", "neighborhood": "Silver Lake", "cuisine": "Thai"},
    {"id": "kismet", "name": "Kismet", "neighborhood": "Los Feliz", "cuisine": "Middle Eastern"},
    {"id": "damian", "name": "Damian", "neighborhood": "Arts District", "cuisine": "Mexican"},
    {"id": "girl-and-the-goat", "name": "Girl & The Goat", "neighborhood": "Arts District", "cuisine": "New American"},
    {"id": "anajak-thai", "name": "Anajak Thai", "neighborhood": "Sherman Oaks", "cuisine": "Thai"},
    {"id": "yangban", "name": "Yangban", "neighborhood": "Arts District", "cuisine": "Korean American"},
    {"id": "camphor", "name": "Camphor", "neighborhood": "Arts District", "cuisine": "French Indian"},
    {"id": "redbird", "name": "Redbird", "neighborhood": "DTLA", "cuisine": "New American"},
    # --- Expanded coverage (all LA regions + more POS candidates) ---
    {"id": "gjusta", "name": "Gjusta", "neighborhood": "Venice", "cuisine": "Bakery / Deli"},
    {"id": "cecconis", "name": "Cecconi's", "neighborhood": "West Hollywood", "cuisine": "Italian"},
    {"id": "the-ivy", "name": "The Ivy", "neighborhood": "Beverly Hills", "cuisine": "California"},
    {"id": "matsuhisa", "name": "Matsuhisa", "neighborhood": "Beverly Hills", "cuisine": "Japanese"},
    {"id": "nice-guy", "name": "The Nice Guy", "neighborhood": "West Hollywood", "cuisine": "Italian"},
    {"id": "forma", "name": "Forma", "neighborhood": "Santa Monica", "cuisine": "Italian"},
    {"id": "sqirl", "name": "Sqirl", "neighborhood": "Silver Lake", "cuisine": "Breakfast"},
    {"id": "pine-and-crane", "name": "Pine & Crane", "neighborhood": "Silver Lake", "cuisine": "Taiwanese"},
    {"id": "here-looking-at-you", "name": "Here's Looking At You", "neighborhood": "Koreatown", "cuisine": "New American"},
    {"id": "guelaguetza", "name": "Guelaguetza", "neighborhood": "Koreatown", "cuisine": "Oaxacan"},
    {"id": "saffys", "name": "Saffy's", "neighborhood": "East Hollywood", "cuisine": "Middle Eastern"},
    {"id": "found-oyster", "name": "Found Oyster", "neighborhood": "East Hollywood", "cuisine": "Seafood"},
    {"id": "all-day-baby", "name": "All Day Baby", "neighborhood": "Silver Lake", "cuisine": "Diner"},
    {"id": "orsa-winston", "name": "Orsa & Winston", "neighborhood": "DTLA", "cuisine": "Italian Japanese"},
    {"id": "bottega-louie", "name": "Bottega Louie", "neighborhood": "DTLA", "cuisine": "Italian"},
    {"id": "71above", "name": "71Above", "neighborhood": "DTLA", "cuisine": "American Fine Dining"},
    {"id": "perch-la", "name": "Perch LA", "neighborhood": "DTLA", "cuisine": "French"},
    {"id": "union-pasadena", "name": "Union Pasadena", "neighborhood": "Pasadena", "cuisine": "Italian"},
    {"id": "bistro-nas", "name": "Bistro Na's", "neighborhood": "San Gabriel", "cuisine": "Imperial Chinese"},
    {"id": "soho-house-weho", "name": "Soho House WeHo", "neighborhood": "West Hollywood", "cuisine": "Private Club"},
    {"id": "vespertine", "name": "Vespertine", "neighborhood": "Culver City", "cuisine": "Experimental"},
    {"id": "destroyer", "name": "Destroyer", "neighborhood": "Culver City", "cuisine": "Nordic Modern"},
    {"id": "hiho-cheeseburger", "name": "HiHo Cheeseburger", "neighborhood": "Santa Monica", "cuisine": "Burgers"},
    {"id": "quarter-sheets", "name": "Quarter Sheets", "neighborhood": "Echo Park", "cuisine": "Pizza"},
    {"id": "bacetti", "name": "Bacetti", "neighborhood": "Echo Park", "cuisine": "Italian"},
    {"id": "tsubaki", "name": "Tsubaki", "neighborhood": "Echo Park", "cuisine": "Japanese"},
    {"id": "nmnaka", "name": "n/naka", "neighborhood": "Palms", "cuisine": "Japanese Kaiseki"},
]

# Non-modern-POS segment — real LA spots that are cash-only or use legacy/light systems.
# These are NOT Qlub prospects (shown in Expo for completeness / honest anti-segment).
NO_POS_SEGMENT = [
    {"id": "tacos-el-gavilan", "name": "Tacos El Gavilan", "neighborhood": "South LA", "cuisine": "Taqueria"},
    {"id": "leos-taco-truck", "name": "Leo's Taco Truck", "neighborhood": "Mid-Wilshire", "cuisine": "Taco Truck"},
    {"id": "mariscos-jalisco", "name": "Mariscos Jalisco", "neighborhood": "Boyle Heights", "cuisine": "Mexican Seafood Truck"},
    {"id": "el-flamin-taco", "name": "El Flamin Taco", "neighborhood": "Hollywood", "cuisine": "Taco Stand"},
    {"id": "tacos-y-birria-la-unica", "name": "Tacos y Birria La Unica", "neighborhood": "Cypress Park", "cuisine": "Birria Stand"},
    {"id": "grand-central-market", "name": "Grand Central Market", "neighborhood": "DTLA", "cuisine": "Food Hall"},
    {"id": "smorgasburg-la", "name": "Smorgasburg LA", "neighborhood": "Arts District", "cuisine": "Pop-up Market"},
    {"id": "langers-cash", "name": "Langer's (cash-line)", "neighborhood": "Westlake", "cuisine": "Jewish Deli"},
    {"id": "cole-pete-schwabs", "name": "Cole's P.E. Buffet", "neighborhood": "DTLA", "cuisine": "Historic Bar"},
    {"id": "philippe-original", "name": "Philippe The Original", "neighborhood": "Chinatown", "cuisine": "French Dip (cash line)"},
    {"id": "guisados-carts", "name": "Guisados Carts", "neighborhood": "Boyle Heights", "cuisine": "Mobile Taqueria"},
    {"id": "carnitas-el-momo", "name": "Carnitas El Momo", "neighborhood": "Boyle Heights", "cuisine": "Carnitas Truck"},
    {"id": "holbox-stand", "name": "Holbox (Mercado walk-up)", "neighborhood": "South LA", "cuisine": "Seafood Stand"},
    {"id": "sonoritas-prime-tacos", "name": "Sonoritas Prime Tacos", "neighborhood": "West LA", "cuisine": "Taqueria"},
    {"id": "kogi-truck", "name": "Kogi BBQ Truck", "neighborhood": "Mobile", "cuisine": "Korean-Mexican Truck"},
]

# ---------- Prompt ----------
PROMPT_TEMPLATE = """You are a meticulous market research analyst. Research the restaurant "{name}" in {neighborhood}, Los Angeles, using Google Search.

Goal: Extract ONLY factual, sourced data. NEVER invent quotes, POS systems, or reviews.

Return ONE JSON object exactly:
{{
  "pos": {{
    "system": "<Toast|Micros|Square|Aloha|Clover|TouchBistro|Resy|OpenTable|Unknown>",
    "confidence": "<high|medium|low|none>",
    "evidence_url": "<real URL or null>",
    "evidence_quote": "<exact text from that page mentioning POS, or null>"
  }},
  "reviews": [
    {{
      "issue": "<pos|wait_time|billing|tipping>",
      "quote": "<short EXACT quote from a real review (≤ 160 chars)>",
      "source": "<Google|Yelp|Eater|Reddit|TripAdvisor|OpenTable|other>",
      "source_url": "<real URL>",
      "date": "<YYYY or YYYY-MM if known, else null>"
    }}
  ],
  "notes": "<1 short honest line about what you found or didn't find>"
}}

STRICT RULES:
1. If you cannot find proof of the POS system from a real, quotable source → set pos.system = "Unknown" and confidence = "none". DO NOT GUESS.
2. Every review quote MUST be a near-verbatim excerpt from a real page you can cite with a URL. If you can't find ≥ 1 real quote, return reviews: [].
3. Focus reviews on these 4 issue categories only: pos (POS crashes/slow/can't split), wait_time (slow bill close-out, check wait), billing (wrong charges, auto-grat disputes), tipping (tip prompt issues, tip on tax confusion).
4. Max 8 reviews per restaurant. Prefer recency and specificity.
5. Output JSON ONLY. No markdown, no code fences, no prose outside the JSON.
"""


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    try:
        return json.loads(t)
    except Exception:
        m = re.search(r"\{.*\}", t, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
    return None


def _response_text(response) -> str:
    try:
        t = response.text or ""
        if t.strip():
            return t
    except Exception:
        pass
    chunks = []
    for cand in response.candidates or []:
        content = getattr(cand, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", None) or []:
            pt = getattr(part, "text", None)
            if pt:
                chunks.append(pt)
    return "\n".join(chunks)


def fetch(r: Dict[str, Any]) -> Dict[str, Any]:
    prompt = PROMPT_TEMPLATE.format(name=r["name"], neighborhood=r["neighborhood"])
    for model in ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]:
        for attempt in range(2):
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        temperature=0.2,
                    ),
                )
                text = _response_text(resp)
                data = _extract_json(text)
                if data:
                    # Merge grounding citations if present
                    cites = []
                    for cand in resp.candidates or []:
                        gm = getattr(cand, "grounding_metadata", None)
                        if not gm:
                            continue
                        for ch in getattr(gm, "grounding_chunks", []) or []:
                            web = getattr(ch, "web", None)
                            if web:
                                cites.append({
                                    "title": getattr(web, "title", "") or "",
                                    "url": getattr(web, "uri", "") or "",
                                })
                    data["_model"] = model
                    data["_grounding_citations"] = cites[:10]
                    return data
            except Exception as e:
                msg = str(e)
                print(f"  ! {model} attempt {attempt}: {msg[:120]}")
                if "503" in msg or "UNAVAILABLE" in msg or "429" in msg or "overload" in msg.lower():
                    time.sleep(1.5 * (attempt + 1))
                    continue
                time.sleep(0.6)
    return {
        "pos": {"system": "Unknown", "confidence": "none", "evidence_url": None, "evidence_quote": None},
        "reviews": [],
        "notes": "Gemini unreachable after retries.",
    }


def main():
    # Preserve any existing entries (avoid re-burning Gemini quota)
    prospect_path = DATA_DIR / "voc_dataset.json"
    existing_by_id: Dict[str, Dict[str, Any]] = {}
    if prospect_path.exists():
        try:
            prev = json.load(open(prospect_path))
            for row in prev.get("restaurants", []):
                existing_by_id[row["id"]] = row
        except Exception:
            existing_by_id = {}

    out_rows: List[Dict[str, Any]] = []
    total = len(PROSPECTS)
    for i, r in enumerate(PROSPECTS, 1):
        if r["id"] in existing_by_id:
            out_rows.append(existing_by_id[r["id"]])
            print(f"[{i}/{total}] {r['name']} · cached, skipping")
            continue
        print(f"[{i}/{total}] {r['name']} · {r['neighborhood']} (fetching)")
        data = fetch(r)
        out_rows.append({**r, "data": data, "is_prospect": True})
        # Save incrementally so a crash doesn't lose progress
        with open(prospect_path, "w") as f:
            json.dump({"fetched_at": int(time.time()), "restaurants": out_rows}, f, indent=2)
        time.sleep(0.8)

    with open(prospect_path, "w") as f:
        json.dump({"fetched_at": int(time.time()), "restaurants": out_rows}, f, indent=2)
    print(f"\nSaved {len(out_rows)} prospects → {prospect_path}")

    # Save the no-POS segment as-is (no Gemini calls — we're just honest they don't have a modern POS)
    nopos_path = DATA_DIR / "no_pos_segment.json"
    with open(nopos_path, "w") as f:
        json.dump({"restaurants": NO_POS_SEGMENT}, f, indent=2)
    print(f"Saved {len(NO_POS_SEGMENT)} no-POS entries → {nopos_path}")


if __name__ == "__main__":
    main()
