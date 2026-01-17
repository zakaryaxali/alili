"""Geometry utilities for pose analysis"""

import numpy as np


def calculate_angle(
    point1: dict[str, float],
    point2: dict[str, float],
    point3: dict[str, float],
) -> float:
    """
    Calculate angle between three points.

    Args:
        point1: First landmark dictionary with 'x', 'y' keys
        point2: Vertex landmark dictionary (the angle is measured here)
        point3: Third landmark dictionary with 'x', 'y' keys

    Returns:
        Angle in degrees (0-180)
    """
    v1 = np.array([point1["x"] - point2["x"], point1["y"] - point2["y"]])
    v2 = np.array([point3["x"] - point2["x"], point3["y"] - point2["y"]])

    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    angle = np.arccos(cos_angle)

    return float(np.degrees(angle))
