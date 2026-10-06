import sys
import os
from datetime import datetime, timezone


from app.db.session import SessionLocal
from app.modules.m4_attacks.models import AttackProblemSet
from app.modules.m2_platform_sync.models import SolvedProblem
from app.modules.m1_auth.models import JudgeAccount
from app.modules.m4_attacks.models import Attack
from app.modules.m9_admin_config.models import GameBalanceConfig

db = SessionLocal()

def fix_attack_problems():
    print("Fixing current attacks...")
    attacks = db.query(Attack).filter(Attack.status == 'in_progress').all()
    for attack in attacks:
        attacker_id = attack.attacker_user_id
        attacker_accounts = db.query(JudgeAccount).filter(JudgeAccount.user_id == attacker_id).all()
        account_ids = [acc.id for acc in attacker_accounts]
        
        ap_sets = db.query(AttackProblemSet).filter(AttackProblemSet.attack_id == str(attack.id)).all()
        for ap_set in ap_sets:
            if not ap_set.solved_flag and account_ids:
                sp = db.query(SolvedProblem).filter(
                    SolvedProblem.judge_account_id.in_(account_ids),
                    SolvedProblem.problem_ext_id == ap_set.problem_ext_id
                ).first()
                if sp:
                    ap_set.solved_flag = True
                    ap_set.solved_at = sp.solved_at
                    print(f"Fixed {ap_set.problem_ext_id} for attack {attack.id}")
    
    db.commit()

def disable_recent_attack_cooldown():
    print("Disabling recent attack cooldown in game balance config...")
    cfg = db.query(GameBalanceConfig).filter(GameBalanceConfig.key == "matchmaking.recent_attack_window_h").first()
    if cfg:
        cfg.value = "0"
    else:
        cfg = GameBalanceConfig(key="matchmaking.recent_attack_window_h", value="0", value_type="float")
        db.add(cfg)
        
    cfg_cd = db.query(GameBalanceConfig).filter(GameBalanceConfig.key == "attack.cooldown_minutes").first()
    if cfg_cd:
        cfg_cd.value = "0"
    else:
        cfg_cd = GameBalanceConfig(key="attack.cooldown_minutes", value="0", value_type="float")
        db.add(cfg_cd)
    
    db.commit()

try:
    fix_attack_problems()
    disable_recent_attack_cooldown()
    print("Done")
finally:
    db.close()

