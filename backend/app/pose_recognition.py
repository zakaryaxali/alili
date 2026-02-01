from .utils.geometry import calculate_angle

# Pose orientation requirements - which view each pose needs
POSE_ORIENTATIONS: dict[str, list[str]] = {
    # Side view poses
    "Downward Dog": ["side_left", "side_right"],
    "Plank": ["side_left", "side_right"],
    "Reverse Table Top": ["side_left", "side_right"],
    # Front view poses
    "Mountain Pose": ["front"],
    "Warrior II Left": ["front"],
    "Warrior II Right": ["front"],
    "Tree Pose Left": ["front"],
    "Tree Pose Right": ["front"],
    "Easy Seat": ["front"],
    "Seated Hands Behind Back Stretch": ["front"],
    "Gomukasana Legs Fold": ["front"],
    # Supine poses (camera pointing down or front view while lying)
    "Supine Bound Angle": ["front", "supine"],
    "Hug the Knees": ["front", "supine"],
    "Supine Bent Knees": ["front", "supine"],
    # Any orientation works
    "Janu Sirsasana Twist Left": ["front", "side_left", "side_right"],
    "Janu Sirsasana Twist Right": ["front", "side_left", "side_right"],
    "Janu Sirsasana Revolved Left": ["front", "side_left", "side_right"],
    "Janu Sirsasana Revolved Right": ["front", "side_left", "side_right"],
}


def detect_orientation(landmarks: list[dict]) -> str:
    """
    Detect user's orientation relative to camera.

    Uses shoulder width (x-distance) and depth difference (z-distance)
    to determine if user is facing the camera or sideways.

    Args:
        landmarks: List of 33 MediaPipe landmarks with x, y, z, visibility

    Returns:
        'front', 'side_left', 'side_right', or 'supine'
    """
    if not landmarks or len(landmarks) < 33:
        return "front"

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    # Calculate shoulder width (x-distance between shoulders)
    shoulder_width = abs(left_shoulder["x"] - right_shoulder["x"])

    # Calculate shoulder depth difference (z-distance)
    # Positive means left shoulder is closer to camera
    shoulder_depth_diff = left_shoulder["z"] - right_shoulder["z"]

    # Check if supine (lying down) - hips higher than shoulders in y
    avg_shoulder_y = (left_shoulder["y"] + right_shoulder["y"]) / 2
    avg_hip_y = (left_hip["y"] + right_hip["y"]) / 2
    if avg_hip_y < avg_shoulder_y - 0.15:
        return "supine"

    # Side view: shoulders appear close together horizontally
    # When facing sideways, shoulder width is very small
    if shoulder_width < 0.15:
        # Use z-depth to determine which side is facing camera
        return "side_left" if shoulder_depth_diff > 0 else "side_right"

    return "front"


class YogaPoseRecognizer:
    """Recognize yoga poses from detected landmarks"""

    def __init__(self):
        # Define reference poses with key angle configurations
        self.reference_poses = {
            "Mountain Pose": {
                "angles": {
                    "left_elbow": 180,
                    "right_elbow": 180,
                    "left_knee": 180,
                    "right_knee": 180,
                    "left_hip": 180,
                    "right_hip": 180,
                },
                "tolerance": 20,
            },
            "Warrior II Left": {
                "angles": {
                    "left_knee": 90,  # Front leg bent
                    "right_knee": 180,  # Back leg straight
                    "left_shoulder": 90,
                    "right_shoulder": 90,
                },
                "tolerance": 25,
            },
            "Warrior II Right": {
                "angles": {
                    "left_knee": 180,  # Back leg straight
                    "right_knee": 90,  # Front leg bent
                    "left_shoulder": 90,
                    "right_shoulder": 90,
                },
                "tolerance": 25,
            },
            "Tree Pose Left": {
                "angles": {
                    "left_knee": 180,  # Standing leg straight
                    "right_knee": 90,  # Raised leg bent
                    "left_hip": 180,
                    "right_hip": 45,
                },
                "tolerance": 25,
            },
            "Tree Pose Right": {
                "angles": {
                    "left_knee": 90,  # Raised leg bent
                    "right_knee": 180,  # Standing leg straight
                    "left_hip": 45,
                    "right_hip": 180,
                },
                "tolerance": 25,
            },
            "Downward Dog": {
                "angles": {
                    "left_hip": 45,
                    "right_hip": 45,
                    "left_knee": 180,
                    "right_knee": 180,
                    "left_shoulder": 180,
                    "right_shoulder": 180,
                },
                "tolerance": 25,
            },
            "Plank": {
                "angles": {
                    "left_elbow": 180,
                    "right_elbow": 180,
                    "left_hip": 180,
                    "right_hip": 180,
                    "left_knee": 180,
                    "right_knee": 180,
                },
                "tolerance": 15,
            },
            "Supine Bound Angle": {
                "angles": {"left_knee": 55, "right_knee": 55, "left_hip": 55, "right_hip": 55},
                "tolerance": 20,
            },
            "Hug the Knees": {
                "angles": {"left_knee": 50, "right_knee": 50, "left_hip": 50, "right_hip": 50},
                "tolerance": 20,
            },
            "Easy Seat": {
                "angles": {"left_knee": 55, "right_knee": 55, "left_hip": 85, "right_hip": 85},
                "tolerance": 30,
            },
            "Seated Hands Behind Back Stretch": {
                "angles": {
                    "left_elbow": 165,
                    "right_elbow": 165,
                    "left_shoulder": 35,
                    "right_shoulder": 35,
                },
                "tolerance": 20,
            },
            "Gomukasana Legs Fold": {
                "angles": {"left_knee": 90, "right_knee": 90, "left_hip": 85, "right_hip": 85},
                "tolerance": 20,
            },
            "Janu Sirsasana Twist Left": {
                "angles": {
                    "left_knee": 180,  # Extended leg
                    "right_knee": 90,  # Bent leg
                    "left_hip": 90,
                    "right_hip": 90,
                },
                "tolerance": 25,
            },
            "Janu Sirsasana Twist Right": {
                "angles": {
                    "left_knee": 90,  # Bent leg
                    "right_knee": 180,  # Extended leg
                    "left_hip": 90,
                    "right_hip": 90,
                },
                "tolerance": 25,
            },
            "Janu Sirsasana Revolved Left": {
                "angles": {
                    "left_knee": 180,  # Extended leg
                    "right_knee": 90,  # Bent leg
                    "left_hip": 70,
                    "right_hip": 90,
                },
                "tolerance": 25,
            },
            "Janu Sirsasana Revolved Right": {
                "angles": {
                    "left_knee": 90,  # Bent leg
                    "right_knee": 180,  # Extended leg
                    "left_hip": 90,
                    "right_hip": 70,
                },
                "tolerance": 25,
            },
            "Reverse Table Top": {
                "angles": {
                    "left_elbow": 180,
                    "right_elbow": 180,
                    "left_hip": 90,
                    "right_hip": 90,
                    "left_shoulder": 90,
                    "right_shoulder": 90,
                },
                "tolerance": 20,
            },
            "Supine Bent Knees": {
                "angles": {"left_knee": 90, "right_knee": 90, "left_hip": 90, "right_hip": 90},
                "tolerance": 20,
            },
        }

    def recognize(self, landmarks: list[dict]) -> tuple[str, float]:
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
                current_angles, config["angles"], config["tolerance"]
            )

            if confidence > best_confidence:
                best_confidence = confidence
                best_match = pose_name

        # Only return pose if confidence is above threshold
        if best_confidence < 0.6:
            return "Unknown", best_confidence

        return best_match, best_confidence

    def evaluate_target_pose(
        self, landmarks: list[dict], target_pose: str
    ) -> tuple[float | None, dict, str, bool]:
        """
        Evaluate how well current pose matches a specific target pose.

        Args:
            landmarks: List of landmark dictionaries with x, y, z, visibility
            target_pose: Name of the target pose to evaluate against

        Returns:
            Tuple of (confidence, angle_breakdown, orientation, orientation_valid)
            - confidence: Overall match score (0.0 to 1.0), or None if wrong orientation
            - angle_breakdown: Dict with per-joint comparison details
            - orientation: Current user orientation ('front', 'side_left', etc.)
            - orientation_valid: Whether user is in correct orientation for pose
        """
        if not landmarks or len(landmarks) < 33:
            return 0.0, {}, "front", True

        # Detect current orientation
        orientation = detect_orientation(landmarks)

        # Check if orientation is valid for target pose
        orientation_valid = True
        if target_pose in POSE_ORIENTATIONS:
            required_orientations = POSE_ORIENTATIONS[target_pose]
            orientation_valid = orientation in required_orientations

        # If wrong orientation, return None confidence to indicate can't score
        if not orientation_valid:
            return None, {}, orientation, False

        if target_pose not in self.reference_poses:
            return 0.0, {}, orientation, True

        # Calculate current pose angles
        current_angles = self._calculate_angles(landmarks)

        # Get reference pose configuration
        reference_config = self.reference_poses[target_pose]
        reference_angles = reference_config["angles"]
        tolerance = reference_config["tolerance"]

        # Calculate overall confidence
        confidence = self._calculate_similarity(current_angles, reference_angles, tolerance)

        # Build detailed angle breakdown
        angle_breakdown = {}
        for joint, ref_angle in reference_angles.items():
            if joint in current_angles:
                current_angle = current_angles[joint]
                diff = abs(current_angle - ref_angle)

                # Determine status based on difference
                if diff <= tolerance:
                    status = "good"
                elif diff <= tolerance * 1.5:
                    status = "needs_improvement"
                else:
                    status = "poor"

                angle_breakdown[joint] = {
                    "current": round(current_angle, 1),
                    "target": ref_angle,
                    "difference": round(diff, 1),
                    "status": status,
                }

        return confidence, angle_breakdown, orientation, orientation_valid

    def _calculate_angles(self, landmarks: list[dict]) -> dict[str, float]:
        """Calculate key joint angles from landmarks"""
        angles = {}

        # Left elbow angle
        angles["left_elbow"] = calculate_angle(
            landmarks[11],
            landmarks[13],
            landmarks[15],  # shoulder, elbow, wrist
        )

        # Right elbow angle
        angles["right_elbow"] = calculate_angle(landmarks[12], landmarks[14], landmarks[16])

        # Left knee angle
        angles["left_knee"] = calculate_angle(
            landmarks[23],
            landmarks[25],
            landmarks[27],  # hip, knee, ankle
        )

        # Right knee angle
        angles["right_knee"] = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        # Left hip angle
        angles["left_hip"] = calculate_angle(
            landmarks[11],
            landmarks[23],
            landmarks[25],  # shoulder, hip, knee
        )

        # Right hip angle
        angles["right_hip"] = calculate_angle(landmarks[12], landmarks[24], landmarks[26])

        # Left shoulder angle
        angles["left_shoulder"] = calculate_angle(
            landmarks[13],
            landmarks[11],
            landmarks[23],  # elbow, shoulder, hip
        )

        # Right shoulder angle
        angles["right_shoulder"] = calculate_angle(landmarks[14], landmarks[12], landmarks[24])

        return angles

    def _calculate_similarity(
        self,
        current_angles: dict[str, float],
        reference_angles: dict[str, float],
        tolerance: float,
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
