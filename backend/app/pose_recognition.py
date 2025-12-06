import numpy as np
from typing import List, Dict, Tuple, Optional
import math


class YogaPoseRecognizer:
    """Recognize yoga poses from detected landmarks"""

    def __init__(self):
        # Define reference poses with key angle configurations
        self.reference_poses = {
            'Mountain Pose': {
                'angles': {
                    'left_elbow': 180,
                    'right_elbow': 180,
                    'left_knee': 180,
                    'right_knee': 180,
                    'left_hip': 180,
                    'right_hip': 180
                },
                'tolerance': 20
            },
            'Warrior II': {
                'angles': {
                    'left_knee': 90,
                    'right_knee': 180,
                    'left_shoulder': 90,
                    'right_shoulder': 90
                },
                'tolerance': 25
            },
            'Tree Pose': {
                'angles': {
                    'left_knee': 90,
                    'right_knee': 180,
                    'left_hip': 45,
                    'right_hip': 180
                },
                'tolerance': 25
            },
            'Downward Dog': {
                'angles': {
                    'left_hip': 45,
                    'right_hip': 45,
                    'left_knee': 180,
                    'right_knee': 180,
                    'left_shoulder': 180,
                    'right_shoulder': 180
                },
                'tolerance': 25
            },
            'Plank': {
                'angles': {
                    'left_elbow': 180,
                    'right_elbow': 180,
                    'left_hip': 180,
                    'right_hip': 180,
                    'left_knee': 180,
                    'right_knee': 180
                },
                'tolerance': 15
            }
        }

    def recognize(self, landmarks: List[Dict]) -> Tuple[str, float]:
        """
        Recognize the yoga pose from landmarks.

        Args:
            landmarks: List of landmark dictionaries with x, y, z, visibility

        Returns:
            Tuple of (pose_name, confidence)
        """
        if not landmarks or len(landmarks) < 33:
            return "Unknown", 0.0

        # Calculate current pose angles
        current_angles = self._calculate_angles(landmarks)

        # Compare with reference poses
        best_match = "Unknown"
        best_confidence = 0.0

        for pose_name, config in self.reference_poses.items():
            confidence = self._calculate_similarity(
                current_angles,
                config['angles'],
                config['tolerance']
            )

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = pose_name

        # Only return pose if confidence is above threshold
        if best_confidence < 0.6:
            return "Unknown", best_confidence

        return best_match, best_confidence

    def _calculate_angles(self, landmarks: List[Dict]) -> Dict[str, float]:
        """Calculate key joint angles from landmarks"""
        angles = {}

        # Left elbow angle
        angles['left_elbow'] = self._calculate_angle(
            landmarks[11], landmarks[13], landmarks[15]  # shoulder, elbow, wrist
        )

        # Right elbow angle
        angles['right_elbow'] = self._calculate_angle(
            landmarks[12], landmarks[14], landmarks[16]
        )

        # Left knee angle
        angles['left_knee'] = self._calculate_angle(
            landmarks[23], landmarks[25], landmarks[27]  # hip, knee, ankle
        )

        # Right knee angle
        angles['right_knee'] = self._calculate_angle(
            landmarks[24], landmarks[26], landmarks[28]
        )

        # Left hip angle
        angles['left_hip'] = self._calculate_angle(
            landmarks[11], landmarks[23], landmarks[25]  # shoulder, hip, knee
        )

        # Right hip angle
        angles['right_hip'] = self._calculate_angle(
            landmarks[12], landmarks[24], landmarks[26]
        )

        # Left shoulder angle
        angles['left_shoulder'] = self._calculate_angle(
            landmarks[13], landmarks[11], landmarks[23]  # elbow, shoulder, hip
        )

        # Right shoulder angle
        angles['right_shoulder'] = self._calculate_angle(
            landmarks[14], landmarks[12], landmarks[24]
        )

        return angles

    def _calculate_angle(
        self,
        point1: Dict,
        point2: Dict,
        point3: Dict
    ) -> float:
        """
        Calculate angle between three points.

        Args:
            point1, point2, point3: Landmark dictionaries (point2 is the vertex)

        Returns:
            Angle in degrees
        """
        # Create vectors
        v1 = np.array([point1['x'] - point2['x'], point1['y'] - point2['y']])
        v2 = np.array([point3['x'] - point2['x'], point3['y'] - point2['y']])

        # Calculate angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)

        return np.degrees(angle)

    def _calculate_similarity(
        self,
        current_angles: Dict[str, float],
        reference_angles: Dict[str, float],
        tolerance: float
    ) -> float:
        """
        Calculate similarity between current and reference angles.

        Args:
            current_angles: Current pose angles
            reference_angles: Reference pose angles
            tolerance: Angle tolerance in degrees

        Returns:
            Confidence score (0.0 to 1.0)
        """
        if not reference_angles:
            return 0.0

        total_similarity = 0.0
        count = 0

        for joint, ref_angle in reference_angles.items():
            if joint in current_angles:
                angle_diff = abs(current_angles[joint] - ref_angle)

                # Calculate similarity (1.0 if within tolerance, 0.0 if far off)
                similarity = max(0.0, 1.0 - (angle_diff / (tolerance * 2)))
                total_similarity += similarity
                count += 1

        return total_similarity / count if count > 0 else 0.0
