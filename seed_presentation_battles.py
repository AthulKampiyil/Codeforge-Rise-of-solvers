"""Seed dummy presentation battles and opponents for CodeForge demo.

Creates:
1. Realistic opponents (ByteBandit, AlgorithmAce, CodeNinja, CyberSamurai)
   with complete village profiles, topic progress, and league ranks.
2. In-flight active battle for ak47 (showing 1/3 solved, timer countdown, live preview).
3. Completed 100% victory battle for ak47 (showing 3/3 solved, trophy reward).
4. Completed 67% battle for ak47 (showing 2/3 solved).
5. Defensive victory battle where an opponent attacked ak47 and failed.
"""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend and .env are found
project_root = Path(__file__).resolve().parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(backend_dir))

env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.modules.m1_auth.models import User
from app.modules.m3_village.models import Topic, VillageProfile, VillageTopicProgress
from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger


def seed_presentation_data():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    now = datetime.now(timezone.utc)

    # 1. Find user ak47
    ak47 = db.query(User).filter(User.username == "ak47").first()
    if not ak47:
        print("Error: user 'ak47' not found in database!")
        return

    print(f"Found primary user: {ak47.username} ({ak47.id})")

    # 2. Ensure Topics exist
    topic_map = {}
    for t in db.query(Topic).all():
        topic_map[t.name] = t.id

    # 3. Create dummy opponents
    dummy_opponents = [
        {
            "username": "ByteBandit",
            "email": "bytebandit@codeforge.demo",
            "defense_rating": 330.0,
            "level": 2,
            "solved": 38,
            "trophies": 340,
            "tier": LeagueTier.bronze,
            "weak_topics": ["trees", "dynamic-programming"],
        },
        {
            "username": "AlgorithmAce",
            "email": "algorithmace@codeforge.demo",
            "defense_rating": 395.0,
            "level": 3,
            "solved": 56,
            "trophies": 410,
            "tier": LeagueTier.bronze,
            "weak_topics": ["graphs", "greedy"],
        },
        {
            "username": "CodeNinja",
            "email": "codeninja@codeforge.demo",
            "defense_rating": 435.0,
            "level": 4,
            "solved": 82,
            "trophies": 520,
            "tier": LeagueTier.silver,
            "weak_topics": ["math", "strings"],
        },
        {
            "username": "CyberSamurai",
            "email": "cybersamurai@codeforge.demo",
            "defense_rating": 290.0,
            "level": 2,
            "solved": 24,
            "trophies": 295,
            "tier": LeagueTier.bronze,
            "weak_topics": ["data-structures", "arrays"],
        },
    ]

    opponent_users = {}
    for opp_data in dummy_opponents:
        user = db.query(User).filter(User.username == opp_data["username"]).first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                username=opp_data["username"],
                email=opp_data["email"],
                password_hash=hash_password("password123"),
                is_active=True,
                is_suspended=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        opponent_users[opp_data["username"]] = user

        # Village Profile
        vp = db.query(VillageProfile).filter(VillageProfile.user_id == user.id).first()
        if not vp:
            vp = VillageProfile(
                user_id=user.id,
                defense_rating=opp_data["defense_rating"],
                total_solved=opp_data["solved"],
                average_level=float(opp_data["level"]),
                last_recomputed_at=now,
            )
            db.add(vp)
        else:
            vp.defense_rating = opp_data["defense_rating"]
            vp.total_solved = opp_data["solved"]
            vp.average_level = float(opp_data["level"])

        # League Profile
        lp = db.query(LeagueProfile).filter(LeagueProfile.user_id == user.id).first()
        if not lp:
            lp = LeagueProfile(
                user_id=user.id,
                trophy_count=opp_data["trophies"],
                league_tier=opp_data["tier"],
                updated_at=now,
            )
            db.add(lp)
        else:
            lp.trophy_count = opp_data["trophies"]
            lp.league_tier = opp_data["tier"]

        # Topic progress
        for tname, tid in topic_map.items():
            prog = (
                db.query(VillageTopicProgress)
                .filter(
                    VillageTopicProgress.user_id == user.id,
                    VillageTopicProgress.topic_id == tid,
                )
                .first()
            )
            is_weak = tname in opp_data["weak_topics"]
            t_lvl = 0 if is_weak else opp_data["level"]
            t_pts = 0 if is_weak else (opp_data["level"] * 10)
            if not prog:
                prog = VillageTopicProgress(
                    user_id=user.id,
                    topic_id=tid,
                    level=t_lvl,
                    progress_points=t_pts,
                    updated_at=now,
                )
                db.add(prog)
            else:
                prog.level = t_lvl
                prog.progress_points = t_pts
                prog.updated_at = now

    db.commit()
    print("Created/updated dummy opponents with village and league profiles.")

    # 4. Remove any prior dummy presentation battles to avoid stacking duplicates
    dummy_ids = [u.id for u in opponent_users.values()]
    db.query(Attack).filter(
        (Attack.attacker_user_id.in_(dummy_ids) | Attack.target_user_id.in_(dummy_ids))
    ).delete(synchronize_session=False)
    db.commit()

    # --- Battle 1: Active In-Flight Battle (ak47 vs ByteBandit) ---
    # 1 problem solved (33%), 23 hours remaining
    atk1_id = uuid.uuid4()
    atk1 = Attack(
        id=atk1_id,
        attacker_user_id=ak47.id,
        target_user_id=opponent_users["ByteBandit"].id,
        status=AttackStatus.in_progress,
        score=33,
        solved_fraction=0.33,
        started_at=now - timedelta(hours=1),
        window_expires_at=now + timedelta(hours=23),
        resolved_at=None,
    )
    db.add(atk1)

    db.add_all([
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk1_id,
            problem_ext_id="755-C",
            problem_name="PolandBall and Forest",
            problem_url="https://codeforces.com/problemset/problem/755/C",
            topic_id=topic_map.get("trees"),
            rating=1200,
            solved_flag=True,
            solved_at=now - timedelta(minutes=25),
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk1_id,
            problem_ext_id="189-A",
            problem_name="Cut Ribbon",
            problem_url="https://codeforces.com/problemset/problem/189/A",
            topic_id=topic_map.get("dynamic-programming"),
            rating=1300,
            solved_flag=False,
            solved_at=None,
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk1_id,
            problem_ext_id="1056-D",
            problem_name="Decorate Apple Tree",
            problem_url="https://codeforces.com/problemset/problem/1056/D",
            topic_id=topic_map.get("trees"),
            rating=1400,
            solved_flag=False,
            solved_at=None,
        ),
    ])

    # --- Battle 2: Resolved 100% Victory (ak47 vs AlgorithmAce) ---
    atk2_id = uuid.uuid4()
    atk2 = Attack(
        id=atk2_id,
        attacker_user_id=ak47.id,
        target_user_id=opponent_users["AlgorithmAce"].id,
        status=AttackStatus.resolved,
        score=100,
        solved_fraction=1.0,
        started_at=now - timedelta(hours=3),
        window_expires_at=now + timedelta(hours=21),
        resolved_at=now - timedelta(hours=2),
    )
    db.add(atk2)

    db.add_all([
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk2_id,
            problem_ext_id="115-A",
            problem_name="Party",
            problem_url="https://codeforces.com/problemset/problem/115/A",
            topic_id=topic_map.get("graphs"),
            rating=900,
            solved_flag=True,
            solved_at=now - timedelta(hours=2, minutes=45),
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk2_id,
            problem_ext_id="405-A",
            problem_name="Gravity Flip",
            problem_url="https://codeforces.com/problemset/problem/405/A",
            topic_id=topic_map.get("greedy"),
            rating=900,
            solved_flag=True,
            solved_at=now - timedelta(hours=2, minutes=30),
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk2_id,
            problem_ext_id="20-C",
            problem_name="Dijkstra?",
            problem_url="https://codeforces.com/problemset/problem/20/C",
            topic_id=topic_map.get("graphs"),
            rating=1200,
            solved_flag=True,
            solved_at=now - timedelta(hours=2, minutes=5),
        ),
        # Trophy ledger audit record
        TrophyLedger(
            id=uuid.uuid4(),
            user_id=ak47.id,
            event_type=TrophyEventType.attack_win,
            delta=32,
            resulting_balance=390,
            source_ref_id=atk2_id,
            created_at=now - timedelta(hours=2),
        ),
    ])

    # --- Battle 3: Resolved 67% Partial Victory (ak47 vs CodeNinja) ---
    atk3_id = uuid.uuid4()
    atk3 = Attack(
        id=atk3_id,
        attacker_user_id=ak47.id,
        target_user_id=opponent_users["CodeNinja"].id,
        status=AttackStatus.resolved,
        score=67,
        solved_fraction=0.67,
        started_at=now - timedelta(hours=6),
        window_expires_at=now + timedelta(hours=18),
        resolved_at=now - timedelta(hours=5),
    )
    db.add(atk3)

    db.add_all([
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk3_id,
            problem_ext_id="71-A",
            problem_name="Way Too Long Words",
            problem_url="https://codeforces.com/problemset/problem/71/A",
            topic_id=topic_map.get("strings"),
            rating=800,
            solved_flag=True,
            solved_at=now - timedelta(hours=5, minutes=40),
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk3_id,
            problem_ext_id="236-A",
            problem_name="Boy or Girl",
            problem_url="https://codeforces.com/problemset/problem/236/A",
            topic_id=topic_map.get("strings"),
            rating=800,
            solved_flag=True,
            solved_at=now - timedelta(hours=5, minutes=20),
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk3_id,
            problem_ext_id="118-A",
            problem_name="String Task",
            problem_url="https://codeforces.com/problemset/problem/118/A",
            topic_id=topic_map.get("strings"),
            rating=1000,
            solved_flag=False,
            solved_at=None,
        ),
        # Trophy ledger audit record
        TrophyLedger(
            id=uuid.uuid4(),
            user_id=ak47.id,
            event_type=TrophyEventType.attack_win,
            delta=18,
            resulting_balance=358,
            source_ref_id=atk3_id,
            created_at=now - timedelta(hours=5),
        ),
    ])

    # --- Battle 4: Resolved Defensive Victory (CyberSamurai vs ak47) ---
    atk4_id = uuid.uuid4()
    atk4 = Attack(
        id=atk4_id,
        attacker_user_id=opponent_users["CyberSamurai"].id,
        target_user_id=ak47.id,
        status=AttackStatus.resolved,
        score=0,
        solved_fraction=0.0,
        started_at=now - timedelta(hours=9),
        window_expires_at=now + timedelta(hours=15),
        resolved_at=now - timedelta(hours=8),
    )
    db.add(atk4)

    db.add_all([
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk4_id,
            problem_ext_id="4-A",
            problem_name="Watermelon",
            problem_url="https://codeforces.com/problemset/problem/4/A",
            topic_id=topic_map.get("math"),
            rating=800,
            solved_flag=False,
            solved_at=None,
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk4_id,
            problem_ext_id="50-A",
            problem_name="Domino piling",
            problem_url="https://codeforces.com/problemset/problem/50/A",
            topic_id=topic_map.get("math"),
            rating=800,
            solved_flag=False,
            solved_at=None,
        ),
        AttackProblemSet(
            id=uuid.uuid4(),
            attack_id=atk4_id,
            problem_ext_id="1328-A",
            problem_name="Divisibility Problem",
            problem_url="https://codeforces.com/problemset/problem/1328/A",
            topic_id=topic_map.get("math"),
            rating=900,
            solved_flag=False,
            solved_at=None,
        ),
        # Trophy ledger audit record for defense win
        TrophyLedger(
            id=uuid.uuid4(),
            user_id=ak47.id,
            event_type=TrophyEventType.successful_defense,
            delta=16,
            resulting_balance=340,
            source_ref_id=atk4_id,
            created_at=now - timedelta(hours=8),
        ),
    ])

    # Commit all seeded battles
    db.commit()

    print("Successfully seeded presentation battles!")
    print(f"- In-Flight Battle ID: {atk1_id}")
    print(f"- 100% Victory Battle ID: {atk2_id}")
    print(f"- 67% Battle ID: {atk3_id}")
    print(f"- Defense Victory Battle ID: {atk4_id}")


if __name__ == "__main__":
    seed_presentation_data()
