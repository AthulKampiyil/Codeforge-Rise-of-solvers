import sys
import os
import pytest

# Add backend directory to Python path to import Codeforge modules
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)

from app.modules.m3_village.formulas import level_for

def test_roll_number_level():
    """
    Test Case: Codeforge Village Level Calculation
    Submitted by: Roll No 2024BCD0037
    """
    # Student Test Data - Roll No: 2024BCD0037
    # Testing Codeforge's `level_for(progress_points, base_threshold)` using Roll No digits
    progress_points = 2024
    base_threshold = 37
    
    # Formula uses triangular numbers to calculate level based on threshold and points
    actual_level = level_for(progress_points, base_threshold)
    
    # The calculated level for 2024 points with a 37 threshold is 9
    expected_level = 9
    
    assert actual_level == expected_level
