"""Elo trophy calculation (SADD §7.3.1.3, resolves TBD-5).

Implements the three resolution cases:
- Case 1: scored attack (solved_fraction >= defense_threshold)
- Case 2: successful defense (solved_fraction < defense_threshold)
- Case 3: zero-submission abandon inside the window
"""
from typing import Tuple


def calculate_expected_scores(
    r_attacker: float, r_target: float, elo_divisor: float = 400.0
) -> Tuple[float, float]:
    """
    Compute expected outcomes for attacker and target (SADD §7.3.1.3).

    E_attacker = 1 / (1 + 10^((R_target - R_attacker) / 400))
    E_target   = 1 - E_attacker
    """
    exponent = (r_target - r_attacker) / elo_divisor
    e_attacker = 1.0 / (1.0 + (10.0 ** exponent))
    e_target = 1.0 - e_attacker
    return e_attacker, e_target


def calculate_trophy_delta(
    r_attacker: float,
    r_target: float,
    solved_fraction: float,
    k_factor: int = 32,
    defense_threshold: float = 0.34,
    abandon_penalty: int = 5,
    is_abandoned: bool = False,
    elo_divisor: float = 400.0,
) -> Tuple[int, int]:
    """
    SADD §7.3.1.3 Elo trophy calculation.

    Returns:
        tuple[int, int]: (delta_attacker, delta_target)
    """
    if is_abandoned:
        # Case 3: abandoned with zero submissions inside the window
        # Attacker suffers flat penalty, defender is unaffected
        return -abandon_penalty, 0

    e_attacker, e_target = calculate_expected_scores(
        r_attacker, r_target, elo_divisor=elo_divisor
    )

    if solved_fraction < defense_threshold:
        # Case 2: successful defense (solved_fraction below defense threshold)
        # Treated as f = 0 in the Elo formula
        f = 0.0
        delta_attacker = round(k_factor * (f - e_attacker))
        delta_target = round(k_factor * ((1.0 - f) - e_target))
        return delta_attacker, delta_target

    # Case 1: scored attack (solved_fraction >= defense_threshold)
    delta_attacker = round(k_factor * (solved_fraction - e_attacker))
    delta_target = round(k_factor * ((1.0 - solved_fraction) - e_target))
    return delta_attacker, delta_target
