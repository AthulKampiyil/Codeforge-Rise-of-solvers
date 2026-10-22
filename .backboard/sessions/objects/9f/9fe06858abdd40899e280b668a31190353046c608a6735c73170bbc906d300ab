from app.modules.m3_village.formulas import level_for, points_for, points_to_next_level


def test_points_for_rating_bands():
    assert points_for(None) == 1
    assert points_for(800) == 1
    assert points_for(1600) == 5


def test_triangular_level_boundaries():
    assert level_for(0, 10) == 0
    assert level_for(10, 10) == 1
    assert level_for(29, 10) == 1
    assert level_for(30, 10) == 2
    assert level_for(59, 10) == 2
    assert level_for(60, 10) == 3
    assert points_to_next_level(10, 10) == 20
