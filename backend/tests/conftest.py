"""Shared test fixtures for backend tests."""

import pytest


@pytest.fixture
def sample_landmarks() -> list[dict]:
    """
    Generate sample MediaPipe landmarks for testing.

    Returns 33 landmarks with normalized x, y, z coordinates.
    This represents a person in a neutral standing pose.
    """
    # Base landmarks for a standing person (normalized 0-1 coordinates)
    # MediaPipe uses: x=horizontal, y=vertical (0=top), z=depth
    landmarks = []

    # Approximate positions for 33 MediaPipe pose landmarks
    positions = [
        # Face landmarks (0-10)
        (0.5, 0.1, 0.0),  # 0: nose
        (0.48, 0.08, 0.0),  # 1: left eye inner
        (0.47, 0.08, 0.0),  # 2: left eye
        (0.46, 0.08, 0.0),  # 3: left eye outer
        (0.52, 0.08, 0.0),  # 4: right eye inner
        (0.53, 0.08, 0.0),  # 5: right eye
        (0.54, 0.08, 0.0),  # 6: right eye outer
        (0.45, 0.09, 0.0),  # 7: left ear
        (0.55, 0.09, 0.0),  # 8: right ear
        (0.48, 0.12, 0.0),  # 9: mouth left
        (0.52, 0.12, 0.0),  # 10: mouth right
        # Upper body (11-22)
        (0.4, 0.25, 0.0),  # 11: left shoulder
        (0.6, 0.25, 0.0),  # 12: right shoulder
        (0.35, 0.4, 0.0),  # 13: left elbow
        (0.65, 0.4, 0.0),  # 14: right elbow
        (0.3, 0.55, 0.0),  # 15: left wrist
        (0.7, 0.55, 0.0),  # 16: right wrist
        (0.28, 0.57, 0.0),  # 17: left pinky
        (0.72, 0.57, 0.0),  # 18: right pinky
        (0.27, 0.56, 0.0),  # 19: left index
        (0.73, 0.56, 0.0),  # 20: right index
        (0.29, 0.58, 0.0),  # 21: left thumb
        (0.71, 0.58, 0.0),  # 22: right thumb
        # Lower body (23-32)
        (0.45, 0.5, 0.0),  # 23: left hip
        (0.55, 0.5, 0.0),  # 24: right hip
        (0.45, 0.7, 0.0),  # 25: left knee
        (0.55, 0.7, 0.0),  # 26: right knee
        (0.45, 0.9, 0.0),  # 27: left ankle
        (0.55, 0.9, 0.0),  # 28: right ankle
        (0.44, 0.92, 0.0),  # 29: left heel
        (0.56, 0.92, 0.0),  # 30: right heel
        (0.43, 0.91, 0.0),  # 31: left foot index
        (0.57, 0.91, 0.0),  # 32: right foot index
    ]

    for x, y, z in positions:
        landmarks.append(
            {
                "x": x,
                "y": y,
                "z": z,
                "visibility": 0.99,
            }
        )

    return landmarks


@pytest.fixture
def warrior_ii_left_landmarks(sample_landmarks: list[dict]) -> list[dict]:
    """
    Modify sample landmarks to represent Warrior II Left pose.

    Left leg bent at ~90 degrees, arms extended horizontally.
    """
    landmarks = [lm.copy() for lm in sample_landmarks]

    # Left leg bent (front leg) - knee forward
    landmarks[25]["x"] = 0.3  # left knee forward
    landmarks[25]["y"] = 0.7
    landmarks[27]["x"] = 0.3  # left ankle under knee
    landmarks[27]["y"] = 0.9

    # Right leg straight (back leg)
    landmarks[26]["x"] = 0.7  # right knee back
    landmarks[26]["y"] = 0.7
    landmarks[28]["x"] = 0.75  # right ankle
    landmarks[28]["y"] = 0.9

    # Arms extended horizontally at shoulder height
    landmarks[13]["x"] = 0.2  # left elbow
    landmarks[13]["y"] = 0.25
    landmarks[15]["x"] = 0.05  # left wrist
    landmarks[15]["y"] = 0.25

    landmarks[14]["x"] = 0.8  # right elbow
    landmarks[14]["y"] = 0.25
    landmarks[16]["x"] = 0.95  # right wrist
    landmarks[16]["y"] = 0.25

    return landmarks


@pytest.fixture
def tree_pose_right_landmarks(sample_landmarks: list[dict]) -> list[dict]:
    """
    Modify sample landmarks to represent Tree Pose Right (standing on right leg).

    Right leg straight, left foot on inner right thigh.
    """
    landmarks = [lm.copy() for lm in sample_landmarks]

    # Right leg straight (standing leg)
    landmarks[24]["y"] = 0.5  # right hip
    landmarks[26]["x"] = 0.55  # right knee straight
    landmarks[26]["y"] = 0.7
    landmarks[28]["x"] = 0.55  # right ankle
    landmarks[28]["y"] = 0.9

    # Left leg bent with foot on inner thigh
    landmarks[23]["y"] = 0.5  # left hip
    landmarks[25]["x"] = 0.45  # left knee bent outward
    landmarks[25]["y"] = 0.55
    landmarks[27]["x"] = 0.5  # left ankle near right thigh
    landmarks[27]["y"] = 0.6

    return landmarks
