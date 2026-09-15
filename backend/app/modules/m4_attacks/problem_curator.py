"""Problem set curation (REQ-4.2).

Draws `attack.problem_set_size` (seeded 3) problems from the target's weakest
topics so an attack probes real weaknesses. Generates valid Codeforces problem
URLs ("Open on Codeforces" links) and persists to attack_problem_sets.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.modules.m3_village.service import VillageService

# Seeded problem catalog matching the 8 village topics with real Codeforces problems
PROBLEM_CATALOG: Dict[str, List[Dict[str, Any]]] = {
    "arrays": [
        {"ext_id": "158-A", "name": "Next Round", "rating": 800, "url": "https://codeforces.com/problemset/problem/158/A"},
        {"ext_id": "231-A", "name": "Team", "rating": 800, "url": "https://codeforces.com/problemset/problem/231/A"},
        {"ext_id": "1-A", "name": "Theatre Square", "rating": 1000, "url": "https://codeforces.com/problemset/problem/1/A"},
    ],
    "strings": [
        {"ext_id": "71-A", "name": "Way Too Long Words", "rating": 800, "url": "https://codeforces.com/problemset/problem/71/A"},
        {"ext_id": "112-A", "name": "Petya and Strings", "rating": 800, "url": "https://codeforces.com/problemset/problem/112/A"},
        {"ext_id": "118-A", "name": "String Task", "rating": 1000, "url": "https://codeforces.com/problemset/problem/118/A"},
    ],
    "math": [
        {"ext_id": "4-A", "name": "Watermelon", "rating": 800, "url": "https://codeforces.com/problemset/problem/4/A"},
        {"ext_id": "50-A", "name": "Domino piling", "rating": 800, "url": "https://codeforces.com/problemset/problem/50/A"},
        {"ext_id": "1328-A", "name": "Divisibility Problem", "rating": 900, "url": "https://codeforces.com/problemset/problem/1328/A"},
    ],
    "greedy": [
        {"ext_id": "282-A", "name": "Bit++", "rating": 800, "url": "https://codeforces.com/problemset/problem/282/A"},
        {"ext_id": "263-A", "name": "Beautiful Matrix", "rating": 800, "url": "https://codeforces.com/problemset/problem/263/A"},
        {"ext_id": "405-A", "name": "Gravity Flip", "rating": 900, "url": "https://codeforces.com/problemset/problem/405/A"},
    ],
    "graphs": [
        {"ext_id": "115-A", "name": "Party", "rating": 900, "url": "https://codeforces.com/problemset/problem/115/A"},
        {"ext_id": "20-C", "name": "Dijkstra?", "rating": 1200, "url": "https://codeforces.com/problemset/problem/20/C"},
        {"ext_id": "520-B", "name": "Two Buttons", "rating": 1400, "url": "https://codeforces.com/problemset/problem/520/B"},
    ],
    "trees": [
        {"ext_id": "755-C", "name": "PolandBall and Forest", "rating": 1200, "url": "https://codeforces.com/problemset/problem/755/C"},
        {"ext_id": "61-D", "name": "Eternal Victory", "rating": 1400, "url": "https://codeforces.com/problemset/problem/61/D"},
        {"ext_id": "580-C", "name": "Kefa and Park", "rating": 1500, "url": "https://codeforces.com/problemset/problem/580/C"},
    ],
    "dynamic-programming": [
        {"ext_id": "327-A", "name": "Flipping Game", "rating": 1200, "url": "https://codeforces.com/problemset/problem/327/A"},
        {"ext_id": "189-A", "name": "Cut Ribbon", "rating": 1300, "url": "https://codeforces.com/problemset/problem/189/A"},
        {"ext_id": "455-A", "name": "Boredom", "rating": 1500, "url": "https://codeforces.com/problemset/problem/455/A"},
    ],
    "data-structures": [
        {"ext_id": "4-C", "name": "Registration system", "rating": 1300, "url": "https://codeforces.com/problemset/problem/4/C"},
        {"ext_id": "279-B", "name": "Books", "rating": 1400, "url": "https://codeforces.com/problemset/problem/279/B"},
        {"ext_id": "339-D", "name": "Xenia and Bit Operations", "rating": 1700, "url": "https://codeforces.com/problemset/problem/339/D"},
    ],
}


class ProblemSetCurator:
    """Curates attack challenge problems tailored to target's weaknesses (REQ-4.2)."""

    def __init__(self, db: Session):
        self.db = db
        self.village_svc = VillageService(db)

    def get_weakest_topics(self, target_user_id: str, count: int = 3) -> List[Dict[str, Any]]:
        """
        Identify target user's weakest topics.
        Ascending order of level, tie-broken by progress_points.
        """
        village_data = self.village_svc.get_user_village(target_user_id)
        topics = village_data.get("topics", [])

        if not topics:
            # Fallback: query seeded topics from db
            try:
                rows = self.db.execute(
                    sa.text("SELECT id, name, display_name FROM topics ORDER BY created_at ASC LIMIT :cnt"),
                    {"cnt": count},
                ).fetchall()
                return [{"id": str(r[0]), "name": r[1], "level": 0, "progress_points": 0} for r in rows]
            except Exception:
                return [
                    {"id": None, "name": "math", "level": 0, "progress_points": 0},
                    {"id": None, "name": "arrays", "level": 0, "progress_points": 0},
                    {"id": None, "name": "strings", "level": 0, "progress_points": 0},
                ]

        # Weakest topics: lowest level first, fewest points first
        weakest = sorted(topics, key=lambda t: (t.get("level", 0), t.get("progress_points", 0)))
        return weakest[:count]

    def curate_problem_set(
        self, target_user_id: str, set_size: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Produce curated problem specifications for an attack.
        """
        weak_topics = self.get_weakest_topics(target_user_id, count=set_size)
        curated: List[Dict[str, Any]] = []
        used_ext_ids = set()

        for topic_info in weak_topics:
            topic_name = topic_info.get("name", "arrays")
            topic_id = topic_info.get("id")

            # Match to catalog
            candidates = PROBLEM_CATALOG.get(topic_name, PROBLEM_CATALOG["arrays"])
            chosen = None
            for cand in candidates:
                if cand["ext_id"] not in used_ext_ids:
                    chosen = cand
                    break
            if not chosen:
                chosen = candidates[0]

            used_ext_ids.add(chosen["ext_id"])
            curated.append(
                {
                    "problem_ext_id": chosen["ext_id"],
                    "problem_name": chosen["name"],
                    "problem_url": chosen["url"],
                    "topic_id": topic_id,
                    "rating": chosen["rating"],
                }
            )

        return curated[:set_size]
