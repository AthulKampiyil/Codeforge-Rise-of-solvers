import sys
import os
import pytest

# Add backend directory to Python path to import Codeforge modules
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)

from app.modules.m3_village.formulas import points_for

def test_roll_number_points():
    """
    Test Case: Codeforge Village Progress Points
    Submitted by: Roll No 2024BCD0037
    """
    # Student Test Data - Roll No: 2024BCD0037
    # Testing Codeforge's `points_for(rating)` using the year part of the Roll No
    rating_input = 2024
    
    # Formula logic: 1 + max(0, (2024 - 800) // 200) -> 1 + (1224 // 200) -> 1 + 6 = 7
    expected_points = 7
    
    actual_points = points_for(rating_input)
    assert actual_points == expected_points
