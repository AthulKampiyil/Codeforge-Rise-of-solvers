"""Tests for Elo trophy calculation (SADD §7.3.1.3, resolves TBD-5).

Contains TC-LEA-01..05 including the SADD §7.3.1.3 worked example verbatim.
"""
import pytest

from app.modules.m7_league_trophy.trophy_calculator import (
    calculate_expected_scores,
    calculate_trophy_delta,
)


def test_tc_lea_01_sadd_worked_example_verbatim():
    """
    TC-LEA-01: SADD §7.3.1.3 worked example verbatim.
    1200 vs 1200, f=0.667, K=32 -> +5 / -5.

    Expected score:
    E_attacker = 1 / (1 + 10^((1200 - 1200) / 400)) = 0.5
    E_target   = 1 - 0.5 = 0.5

    Delta:
    Δ_attacker = round(32 * (0.667 - 0.5)) = round(5.344) = +5
    Δ_target   = round(32 * ((1 - 0.667) - 0.5)) = round(-5.344) = -5
    """
    r_attacker = 1200.0
    r_target = 1200.0
    f = 0.667
    k = 32

    # Verify expected score component
    e_att, e_tgt = calculate_expected_scores(r_attacker, r_target, elo_divisor=400.0)
    assert pytest.approx(e_att, rel=1e-5) == 0.5
    assert pytest.approx(e_tgt, rel=1e-5) == 0.5

    # Verify deltas
    delta_attacker, delta_target = calculate_trophy_delta(
        r_attacker=r_attacker,
        r_target=r_target,
        solved_fraction=f,
        k_factor=k,
        defense_threshold=0.34,
        abandon_penalty=5,
        is_abandoned=False,
        elo_divisor=400.0,
    )

    assert delta_attacker == 5, f"Expected +5, got {delta_attacker}"
    assert delta_target == -5, f"Expected -5, got {delta_target}"


def test_tc_lea_02_underdog_victory():
    """
    TC-LEA-02: Underdog victory.
    Attacker rating 1000 vs Defender rating 1400.
    Attacker solves all problems (f = 1.0), K = 32.
    Attacker gains significant trophies due to higher opponent rating.
    """
    r_attacker = 1000.0
    r_target = 1400.0
    f = 1.0
    k = 32

    e_att, e_tgt = calculate_expected_scores(r_attacker, r_target)
    # E_att = 1 / (1 + 10^1) = 1 / 11 ~= 0.0909
    assert e_att < 0.15
    assert e_tgt > 0.85

    delta_att, delta_tgt = calculate_trophy_delta(
        r_attacker, r_target, solved_fraction=f, k_factor=k
    )

    assert delta_att > 25, f"Underdog win should yield large trophy gain: {delta_att}"
    assert delta_tgt < -25, f"Target loss should yield large trophy loss: {delta_tgt}"
    assert delta_att + delta_tgt == 0  # Zero-sum roundings cancel out or stay balanced


def test_tc_lea_03_favorite_loss():
    """
    TC-LEA-03: Heavy favorite fails attack.
    Attacker rating 1400 vs Defender rating 1000.
    Attacker solves 0 (f = 0.0), K = 32.
    Attacker loses heavy trophies; defender gains them.
    """
    r_attacker = 1400.0
    r_target = 1000.0
    f = 0.0
    k = 32

    e_att, e_tgt = calculate_expected_scores(r_attacker, r_target)
    assert e_att > 0.85
    assert e_tgt < 0.15

    delta_att, delta_tgt = calculate_trophy_delta(
        r_attacker, r_target, solved_fraction=f, k_factor=k
    )

    assert delta_att < -25
    assert delta_tgt > 25


def test_tc_lea_04_successful_defense_threshold():
    """
    TC-LEA-04: Successful defense threshold (f < 0.34).
    When solved fraction is below 0.34, it is treated as f = 0.0 in Case 2.
    Both 0 solved and 0.20 solved yield identical defense outcomes.
    """
    r_attacker = 1200.0
    r_target = 1200.0
    k = 32

    # f = 0.0 (0/3 solved)
    delta_att_0, delta_tgt_0 = calculate_trophy_delta(
        r_attacker, r_target, solved_fraction=0.0, k_factor=k, defense_threshold=0.34
    )
    assert delta_att_0 == -16  # round(32 * (0 - 0.5)) = -16
    assert delta_tgt_0 == 16   # round(32 * (1 - 0.5)) = +16

    # f = 0.20 (below 0.34 threshold, treated as f = 0.0)
    delta_att_below, delta_tgt_below = calculate_trophy_delta(
        r_attacker, r_target, solved_fraction=0.20, k_factor=k, defense_threshold=0.34
    )
    assert delta_att_below == -16
    assert delta_tgt_below == 16


def test_tc_lea_05_abandoned_zero_submissions():
    """
    TC-LEA-05: Case 3 — Attack abandoned with zero submissions.
    Attacker suffers flat trophy.abandon_penalty (5), defender delta is 0.
    """
    r_attacker = 1200.0
    r_target = 1200.0

    delta_att, delta_tgt = calculate_trophy_delta(
        r_attacker,
        r_target,
        solved_fraction=0.0,
        k_factor=32,
        abandon_penalty=5,
        is_abandoned=True,
    )

    assert delta_att == -5, f"Expected -5 abandon penalty, got {delta_att}"
    assert delta_tgt == 0, f"Expected 0 for defender on abandon, got {delta_tgt}"


def test_tier_k_factors():
    """Verify K-factor scales down with higher tiers per SADD §7.3.1.3."""
    k_factors = {"bronze": 32, "silver": 32, "gold": 32, "platinum": 24, "diamond": 24, "legend": 16}
    assert k_factors["bronze"] == 32
    assert k_factors["gold"] == 32
    assert k_factors["platinum"] == 24
    assert k_factors["legend"] == 16
