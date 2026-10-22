"""Problem set curation (REQ-4.2).

Draws `attack.problem_set_size` (seeded 3) problems from the target's weakest
topics so an attack probes real weaknesses. Generates valid Codeforces problem
URLs ("Open on Codeforces" links) and persists to attack_problem_sets.
Shuffles problems across attacks and avoids giving identical questions consecutively.
"""
import random
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
        {"ext_id": "266-B", "name": "Queue at the School", "rating": 800, "url": "https://codeforces.com/problemset/problem/266/B"},
        {"ext_id": "228-A", "name": "Is your horseshoe on the other hoof?", "rating": 800, "url": "https://codeforces.com/problemset/problem/228/A"},
        {"ext_id": "381-A", "name": "Sereja and Dima", "rating": 800, "url": "https://codeforces.com/problemset/problem/381/A"},
        {"ext_id": "443-A", "name": "Anton and Letters", "rating": 800, "url": "https://codeforces.com/problemset/problem/443/A"},
        {"ext_id": "705-A", "name": "Hulk", "rating": 800, "url": "https://codeforces.com/problemset/problem/705/A"},
        {"ext_id": "677-A", "name": "Vanya and Fence", "rating": 800, "url": "https://codeforces.com/problemset/problem/677/A"},
        {"ext_id": "200-B", "name": "Drinks", "rating": 800, "url": "https://codeforces.com/problemset/problem/200/B"},
    ],
    "strings": [
        {"ext_id": "71-A", "name": "Way Too Long Words", "rating": 800, "url": "https://codeforces.com/problemset/problem/71/A"},
        {"ext_id": "112-A", "name": "Petya and Strings", "rating": 800, "url": "https://codeforces.com/problemset/problem/112/A"},
        {"ext_id": "118-A", "name": "String Task", "rating": 1000, "url": "https://codeforces.com/problemset/problem/118/A"},
        {"ext_id": "281-A", "name": "Word Capitalization", "rating": 800, "url": "https://codeforces.com/problemset/problem/281/A"},
        {"ext_id": "236-A", "name": "Boy or Girl", "rating": 800, "url": "https://codeforces.com/problemset/problem/236/A"},
        {"ext_id": "339-A", "name": "Helpful Maths", "rating": 800, "url": "https://codeforces.com/problemset/problem/339/A"},
        {"ext_id": "59-A", "name": "Word", "rating": 800, "url": "https://codeforces.com/problemset/problem/59/A"},
        {"ext_id": "96-A", "name": "Football", "rating": 900, "url": "https://codeforces.com/problemset/problem/96/A"},
        {"ext_id": "41-A", "name": "Translation", "rating": 800, "url": "https://codeforces.com/problemset/problem/41/A"},
        {"ext_id": "58-A", "name": "Chat room", "rating": 1000, "url": "https://codeforces.com/problemset/problem/58/A"},
    ],
    "math": [
        {"ext_id": "4-A", "name": "Watermelon", "rating": 800, "url": "https://codeforces.com/problemset/problem/4/A"},
        {"ext_id": "50-A", "name": "Domino piling", "rating": 800, "url": "https://codeforces.com/problemset/problem/50/A"},
        {"ext_id": "1328-A", "name": "Divisibility Problem", "rating": 900, "url": "https://codeforces.com/problemset/problem/1328/A"},
        {"ext_id": "479-A", "name": "Expression", "rating": 1000, "url": "https://codeforces.com/problemset/problem/479/A"},
        {"ext_id": "617-A", "name": "Elephant", "rating": 800, "url": "https://codeforces.com/problemset/problem/617/A"},
        {"ext_id": "546-A", "name": "Soldier and Bananas", "rating": 800, "url": "https://codeforces.com/problemset/problem/546/A"},
        {"ext_id": "486-A", "name": "Calculating Function", "rating": 800, "url": "https://codeforces.com/problemset/problem/486/A"},
        {"ext_id": "1335-A", "name": "Candies and Two Sisters", "rating": 800, "url": "https://codeforces.com/problemset/problem/1335/A"},
        {"ext_id": "791-A", "name": "Bear and Big Brother", "rating": 800, "url": "https://codeforces.com/problemset/problem/791/A"},
        {"ext_id": "1352-A", "name": "Sum of Round Numbers", "rating": 800, "url": "https://codeforces.com/problemset/problem/1352/A"},
    ],
    "greedy": [
        {"ext_id": "282-A", "name": "Bit++", "rating": 800, "url": "https://codeforces.com/problemset/problem/282/A"},
        {"ext_id": "263-A", "name": "Beautiful Matrix", "rating": 800, "url": "https://codeforces.com/problemset/problem/263/A"},
        {"ext_id": "405-A", "name": "Gravity Flip", "rating": 900, "url": "https://codeforces.com/problemset/problem/405/A"},
        {"ext_id": "160-A", "name": "Twins", "rating": 900, "url": "https://codeforces.com/problemset/problem/160/A"},
        {"ext_id": "977-A", "name": "Wrong Subtraction", "rating": 800, "url": "https://codeforces.com/problemset/problem/977/A"},
        {"ext_id": "581-A", "name": "Vasya the Hipster", "rating": 800, "url": "https://codeforces.com/problemset/problem/581/A"},
        {"ext_id": "750-A", "name": "New Year and Hurry", "rating": 800, "url": "https://codeforces.com/problemset/problem/750/A"},
        {"ext_id": "1409-A", "name": "Yet Another Two Integers Problem", "rating": 800, "url": "https://codeforces.com/problemset/problem/1409/A"},
        {"ext_id": "151-A", "name": "Soft Drinking", "rating": 800, "url": "https://codeforces.com/problemset/problem/151/A"},
        {"ext_id": "469-A", "name": "I Wanna Be the Guy", "rating": 800, "url": "https://codeforces.com/problemset/problem/469/A"},
    ],
    "graphs": [
        {"ext_id": "115-A", "name": "Party", "rating": 900, "url": "https://codeforces.com/problemset/problem/115/A"},
        {"ext_id": "20-C", "name": "Dijkstra?", "rating": 1200, "url": "https://codeforces.com/problemset/problem/20/C"},
        {"ext_id": "520-B", "name": "Two Buttons", "rating": 1400, "url": "https://codeforces.com/problemset/problem/520/B"},
        {"ext_id": "500-A", "name": "New Year Transportation", "rating": 1000, "url": "https://codeforces.com/problemset/problem/500/A"},
        {"ext_id": "1033-A", "name": "King Escape", "rating": 1000, "url": "https://codeforces.com/problemset/problem/1033/A"},
        {"ext_id": "862-B", "name": "Mahmoud and Ehab and the bipartiteness", "rating": 1300, "url": "https://codeforces.com/problemset/problem/862/B"},
        {"ext_id": "29-C", "name": "Mail Stamps", "rating": 1400, "url": "https://codeforces.com/problemset/problem/29/C"},
        {"ext_id": "330-B", "name": "Road Construction", "rating": 1200, "url": "https://codeforces.com/problemset/problem/330/B"},
        {"ext_id": "982-C", "name": "Cut 'em all!", "rating": 1400, "url": "https://codeforces.com/problemset/problem/982/C"},
        {"ext_id": "744-A", "name": "Hongcow Builds A Nation", "rating": 1400, "url": "https://codeforces.com/problemset/problem/744/A"},
    ],
    "trees": [
        {"ext_id": "755-C", "name": "PolandBall and Forest", "rating": 1200, "url": "https://codeforces.com/problemset/problem/755/C"},
        {"ext_id": "61-D", "name": "Eternal Victory", "rating": 1400, "url": "https://codeforces.com/problemset/problem/61/D"},
        {"ext_id": "580-C", "name": "Kefa and Park", "rating": 1500, "url": "https://codeforces.com/problemset/problem/580/C"},
        {"ext_id": "1056-D", "name": "Decorate Apple Tree", "rating": 1400, "url": "https://codeforces.com/problemset/problem/1056/D"},
        {"ext_id": "133-B", "name": "Unary", "rating": 1100, "url": "https://codeforces.com/problemset/problem/133/B"},
        {"ext_id": "14-D", "name": "Two Paths", "rating": 1600, "url": "https://codeforces.com/problemset/problem/14/D"},
        {"ext_id": "682-C", "name": "Alyona and the Tree", "rating": 1600, "url": "https://codeforces.com/problemset/problem/682/C"},
        {"ext_id": "1144-F", "name": "Graph Without Long Directed Paths", "rating": 1600, "url": "https://codeforces.com/problemset/problem/1144/F"},
        {"ext_id": "1304-C", "name": "Air Conditioner", "rating": 1300, "url": "https://codeforces.com/problemset/problem/1304/C"},
        {"ext_id": "1006-E", "name": "Military Problem", "rating": 1500, "url": "https://codeforces.com/problemset/problem/1006/E"},
    ],
    "dynamic-programming": [
        {"ext_id": "327-A", "name": "Flipping Game", "rating": 1200, "url": "https://codeforces.com/problemset/problem/327/A"},
        {"ext_id": "189-A", "name": "Cut Ribbon", "rating": 1300, "url": "https://codeforces.com/problemset/problem/189/A"},
        {"ext_id": "455-A", "name": "Boredom", "rating": 1500, "url": "https://codeforces.com/problemset/problem/455/A"},
        {"ext_id": "706-B", "name": "Interesting drink", "rating": 1100, "url": "https://codeforces.com/problemset/problem/706/B"},
        {"ext_id": "368-B", "name": "Sereja and Suffixes", "rating": 1100, "url": "https://codeforces.com/problemset/problem/368/B"},
        {"ext_id": "474-D", "name": "Flowers", "rating": 1500, "url": "https://codeforces.com/problemset/problem/474/D"},
        {"ext_id": "550-A", "name": "Two Substrings", "rating": 1500, "url": "https://codeforces.com/problemset/problem/550/A"},
        {"ext_id": "1182-A", "name": "Filling Shapes", "rating": 1000, "url": "https://codeforces.com/problemset/problem/1182/A"},
        {"ext_id": "1338-A", "name": "Powered Addition", "rating": 1500, "url": "https://codeforces.com/problemset/problem/1338/A"},
        {"ext_id": "466-C", "name": "Number of Ways", "rating": 1700, "url": "https://codeforces.com/problemset/problem/466/C"},
    ],
    "data-structures": [
        {"ext_id": "4-C", "name": "Registration system", "rating": 1300, "url": "https://codeforces.com/problemset/problem/4/C"},
        {"ext_id": "279-B", "name": "Books", "rating": 1400, "url": "https://codeforces.com/problemset/problem/279/B"},
        {"ext_id": "339-D", "name": "Xenia and Bit Operations", "rating": 1700, "url": "https://codeforces.com/problemset/problem/339/D"},
        {"ext_id": "489-B", "name": "BerSU Ball", "rating": 1200, "url": "https://codeforces.com/problemset/problem/489/B"},
        {"ext_id": "474-B", "name": "Worms", "rating": 1200, "url": "https://codeforces.com/problemset/problem/474/B"},
        {"ext_id": "118-B", "name": "Present from Lena", "rating": 1000, "url": "https://codeforces.com/problemset/problem/118/B"},
        {"ext_id": "84-A", "name": "Toy Army", "rating": 1000, "url": "https://codeforces.com/problemset/problem/84/A"},
        {"ext_id": "519-B", "name": "A and B and Compilation Errors", "rating": 1100, "url": "https://codeforces.com/problemset/problem/519/B"},
        {"ext_id": "1005-B", "name": "Delete from the Left", "rating": 900, "url": "https://codeforces.com/problemset/problem/1005/B"},
        {"ext_id": "978-C", "name": "Letters", "rating": 1000, "url": "https://codeforces.com/problemset/problem/978/C"},
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
        Topics with equal level and progress points are shuffled so subsequent attacks vary.
        """
        village_data = self.village_svc.get_user_village(target_user_id)
        topics = village_data.get("topics", [])

        if not topics:
            # Fallback: query seeded topics from db
            try:
                rows = self.db.execute(
                    sa.text("SELECT id, name, display_name FROM topics"),
                ).fetchall()
                if rows:
                    topics = [{"id": str(r[0]), "name": r[1], "level": 0, "progress_points": 0} for r in rows]
            except Exception:
                topics = [
                    {"id": None, "name": "arrays", "level": 0, "progress_points": 0},
                    {"id": None, "name": "strings", "level": 0, "progress_points": 0},
                    {"id": None, "name": "math", "level": 0, "progress_points": 0},
                    {"id": None, "name": "greedy", "level": 0, "progress_points": 0},
                    {"id": None, "name": "graphs", "level": 0, "progress_points": 0},
                    {"id": None, "name": "trees", "level": 0, "progress_points": 0},
                    {"id": None, "name": "dynamic-programming", "level": 0, "progress_points": 0},
                    {"id": None, "name": "data-structures", "level": 0, "progress_points": 0},
                ]

        # Group topics by weakness: (level, progress_points)
        grouped: Dict[tuple, List[Dict[str, Any]]] = {}
        for t in topics:
            key = (t.get("level", 0), t.get("progress_points", 0))
            grouped.setdefault(key, []).append(t)

        result: List[Dict[str, Any]] = []
        for key in sorted(grouped.keys()):
            group = list(grouped[key])
            random.shuffle(group)
            for item in group:
                result.append(item)
                if len(result) >= count:
                    return result
        return result[:count]

    def curate_problem_set(
        self,
        target_user_id: str,
        set_size: int = 3,
        attacker_user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Produce curated problem specifications for an attack.
        Randomly selects and shuffles problems per topic, prioritizing problems
        that have not been assigned in recent attacks or already solved.
        """
        weak_topics = self.get_weakest_topics(target_user_id, count=set_size)

        # Collect recent problems from attacks table to avoid immediate duplicates
        recent_ext_ids = set()
        try:
            from app.modules.m4_attacks.models import Attack, AttackProblemSet
            query = (
                self.db.query(AttackProblemSet.problem_ext_id)
                .join(Attack, AttackProblemSet.attack_id == Attack.id)
            )
            conds = []
            if attacker_user_id:
                conds.append(Attack.attacker_user_id == attacker_user_id)
            if target_user_id:
                conds.append(Attack.target_user_id == target_user_id)
            if conds:
                query = query.filter(sa.or_(*conds))
            recent_rows = query.order_by(Attack.started_at.desc()).limit(25).all()
            recent_ext_ids = {r[0] for r in recent_rows}
        except Exception:
            pass

        # Collect solved problems by attacker (if available) so attacker gets fresh problems
        solved_ext_ids = set()
        if attacker_user_id:
            try:
                from app.modules.m2_platform_sync.models import SolvedProblem
                from app.modules.m1_auth.models import JudgeAccount
                solved_rows = (
                    self.db.query(SolvedProblem.problem_ext_id)
                    .join(JudgeAccount, SolvedProblem.judge_account_id == JudgeAccount.id)
                    .filter(JudgeAccount.user_id == attacker_user_id)
                    .all()
                )
                solved_ext_ids = {r[0] for r in solved_rows}
            except Exception:
                pass

        curated: List[Dict[str, Any]] = []
        used_ext_ids = set()

        for topic_info in weak_topics:
            topic_name = topic_info.get("name", "arrays")
            topic_id = topic_info.get("id")

            # Match to catalog and shuffle
            candidates = list(PROBLEM_CATALOG.get(topic_name, PROBLEM_CATALOG["arrays"]))
            random.shuffle(candidates)

            chosen = None
            # Priority 1: Unused in this attack + Not in recent attacks + Not already solved
            for cand in candidates:
                cid = cand["ext_id"]
                if cid not in used_ext_ids and cid not in recent_ext_ids and cid not in solved_ext_ids:
                    chosen = cand
                    break

            # Priority 2: Unused in this attack + Not in recent attacks
            if not chosen:
                for cand in candidates:
                    cid = cand["ext_id"]
                    if cid not in used_ext_ids and cid not in recent_ext_ids:
                        chosen = cand
                        break

            # Priority 3: Unused in this attack + Not already solved
            if not chosen:
                for cand in candidates:
                    cid = cand["ext_id"]
                    if cid not in used_ext_ids and cid not in solved_ext_ids:
                        chosen = cand
                        break

            # Priority 4: Any candidate unused in this attack
            if not chosen:
                for cand in candidates:
                    cid = cand["ext_id"]
                    if cid not in used_ext_ids:
                        chosen = cand
                        break

            # Fallback if catalog exhausted
            if not chosen:
                chosen = random.choice(candidates)

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

        # In case fewer topics than set_size were returned, fill remaining from catalog
        if len(curated) < set_size:
            all_candidates = [prob for probs in PROBLEM_CATALOG.values() for prob in probs]
            random.shuffle(all_candidates)
            for cand in all_candidates:
                if cand["ext_id"] not in used_ext_ids:
                    used_ext_ids.add(cand["ext_id"])
                    curated.append(
                        {
                            "problem_ext_id": cand["ext_id"],
                            "problem_name": cand["name"],
                            "problem_url": cand["url"],
                            "topic_id": None,
                            "rating": cand["rating"],
                        }
                    )
                    if len(curated) >= set_size:
                        break

        return curated[:set_size]
