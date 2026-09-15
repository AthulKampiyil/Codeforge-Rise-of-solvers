"""Pure progression calculations for village topics."""
import math


def points_for(rating: int | None) -> int:
    """Return the progress points awarded for one solved problem."""
    return 1 + max(0, ((rating or 0) - 800) // 200)


def level_for(progress_points: int, base_threshold: int) -> int:
    """Return the greatest level whose triangular cost fits the points."""
    if progress_points <= 0 or base_threshold <= 0:
        return 0
    level = max(0, int((math.sqrt(1 + 8 * progress_points / base_threshold) - 1) // 2))
    # Correct possible floating-point truncation at an exact triangular boundary.
    while base_threshold * (level + 1) * (level + 2) // 2 <= progress_points:
        level += 1
    while base_threshold * level * (level + 1) // 2 > progress_points:
        level -= 1
    return level


def points_to_next_level(progress_points: int, base_threshold: int) -> int:
    level = level_for(progress_points, base_threshold)
    return max(0, base_threshold * ((level + 1) * (level + 2) // 2) - progress_points)


def progress_percent(progress_points: int, base_threshold: int) -> float:
    level = level_for(progress_points, base_threshold)
    start = base_threshold * level * (level + 1) // 2
    cost = base_threshold * (level + 1)
    return round(min(100.0, max(0.0, (progress_points - start) / cost * 100)), 2)


def defense_rating(
    defense_base: float,
    defense_level_weight: float,
    defense_solved_weight: float,
    topic_levels: list[int],
    total_solved: int,
) -> float:
    return round(
        defense_base
        + defense_level_weight * sum(topic_levels)
        + round(defense_solved_weight * total_solved),
        2,
    )
