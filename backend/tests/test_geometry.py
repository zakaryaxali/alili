"""Tests for geometry utility functions."""

import math

from app.utils.geometry import calculate_angle


class TestCalculateAngle:
    """Tests for the calculate_angle function."""

    def test_straight_line_returns_180_degrees(self):
        """Three points in a straight horizontal line should give 180 degrees."""
        point1 = {"x": 0.0, "y": 0.5}
        point2 = {"x": 0.5, "y": 0.5}  # vertex
        point3 = {"x": 1.0, "y": 0.5}

        angle = calculate_angle(point1, point2, point3)

        # Tolerance of 0.2 accounts for epsilon in denominator (prevents div by zero)
        assert math.isclose(angle, 180.0, abs_tol=0.2)

    def test_right_angle_returns_90_degrees(self):
        """Three points forming an L-shape should give 90 degrees."""
        point1 = {"x": 0.0, "y": 0.5}
        point2 = {"x": 0.5, "y": 0.5}  # vertex
        point3 = {"x": 0.5, "y": 0.0}

        angle = calculate_angle(point1, point2, point3)

        assert math.isclose(angle, 90.0, abs_tol=0.1)

    def test_45_degree_angle(self):
        """Three points forming a 45-degree angle."""
        # v1 = (0, -0.5) pointing down, v2 = (0.5, -0.5) pointing down-right at 45°
        point1 = {"x": 0.5, "y": 0.0}
        point2 = {"x": 0.5, "y": 0.5}  # vertex
        point3 = {"x": 1.0, "y": 0.0}

        angle = calculate_angle(point1, point2, point3)

        assert math.isclose(angle, 45.0, abs_tol=0.1)

    def test_acute_angle(self):
        """Test an acute angle (less than 90 degrees)."""
        point1 = {"x": 0.3, "y": 0.0}
        point2 = {"x": 0.5, "y": 0.5}  # vertex
        point3 = {"x": 0.7, "y": 0.0}

        angle = calculate_angle(point1, point2, point3)

        assert 0 < angle < 90

    def test_obtuse_angle(self):
        """Test an obtuse angle (between 90 and 180 degrees)."""
        point1 = {"x": 0.0, "y": 0.4}
        point2 = {"x": 0.5, "y": 0.5}  # vertex
        point3 = {"x": 1.0, "y": 0.4}

        angle = calculate_angle(point1, point2, point3)

        assert 90 < angle < 180

    def test_returns_float(self):
        """Result should always be a float."""
        point1 = {"x": 0.0, "y": 0.0}
        point2 = {"x": 0.5, "y": 0.5}
        point3 = {"x": 1.0, "y": 0.0}

        angle = calculate_angle(point1, point2, point3)

        assert isinstance(angle, float)

    def test_symmetric_angle(self):
        """Angle should be the same regardless of point1/point3 order."""
        point1 = {"x": 0.0, "y": 0.5}
        point2 = {"x": 0.5, "y": 0.5}
        point3 = {"x": 0.5, "y": 0.0}

        angle1 = calculate_angle(point1, point2, point3)
        angle2 = calculate_angle(point3, point2, point1)

        assert math.isclose(angle1, angle2, abs_tol=0.01)

    def test_handles_zero_vector_gracefully(self):
        """Should handle case where points are very close (epsilon prevents division by zero)."""
        point1 = {"x": 0.5, "y": 0.5}
        point2 = {"x": 0.5, "y": 0.5}  # same as point1
        point3 = {"x": 0.5, "y": 0.6}

        # Should not raise an exception due to epsilon in denominator
        angle = calculate_angle(point1, point2, point3)

        assert isinstance(angle, float)
        assert not math.isnan(angle)
