from app.modules.m3_village.formulas import defense_rating
from app.modules.m3_village.service import DEFAULT_BALANCE


def test_empty_village_balance_defaults_are_defined():
    assert DEFAULT_BALANCE["village.defense_base"] == 100
    assert DEFAULT_BALANCE["village.defense_level_weight"] == 10
    assert DEFAULT_BALANCE["village.defense_solved_weight"] == 0.25


def test_defense_rating_uses_levels_and_solved_count():
    assert defense_rating(100, 10, 0.25, [3, 2, 0], 20) == 155.0
    assert defense_rating(100, 10, 0.25, [], 0) == 100.0
