from typing import List, Dict
import numpy as np


class PoseQualityAnalyzer:
    """Analyze pose quality and provide feedback"""

    def __init__(self):
        self.feedback_rules = {
            'Mountain Pose': self._analyze_mountain_pose,
            'Warrior II': self._analyze_warrior_two,
            'Tree Pose': self._analyze_tree_pose,
            'Downward Dog': self._analyze_downward_dog,
            'Plank': self._analyze_plank
        }

    def analyze(self, pose_name: str, landmarks: List[Dict]) -> List[str]:
        """
        Analyze pose quality and generate feedback.

        Args:
            pose_name: Name of the detected pose
            landmarks: List of landmark dictionaries

        Returns:
            List of feedback strings
        """
        if not landmarks or len(landmarks) < 33:
            return ["Unable to analyze pose - not enough landmarks detected"]

        if pose_name not in self.feedback_rules:
            return []

        return self.feedback_rules[pose_name](landmarks)

    def _analyze_mountain_pose(self, landmarks: List[Dict]) -> List[str]:
        """Analyze Mountain Pose (Tadasana)"""
        feedback = []

        # Check if shoulders are level
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        shoulder_diff = abs(left_shoulder['y'] - right_shoulder['y'])

        if shoulder_diff > 0.05:
            if left_shoulder['y'] < right_shoulder['y']:
                feedback.append("Level your shoulders - right shoulder is lower")
            else:
                feedback.append("Level your shoulders - left shoulder is lower")

        # Check if hips are level
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        hip_diff = abs(left_hip['y'] - right_hip['y'])

        if hip_diff > 0.05:
            feedback.append("Keep your hips level")

        # Check if standing straight
        left_knee = landmarks[25]
        left_ankle = landmarks[27]
        if abs(left_knee['x'] - left_ankle['x']) > 0.1:
            feedback.append("Keep your legs straight and aligned")

        if not feedback:
            feedback.append("Great form! Maintain this position")

        return feedback

    def _analyze_warrior_two(self, landmarks: List[Dict]) -> List[str]:
        """Analyze Warrior II Pose"""
        feedback = []

        # Check front knee alignment
        left_knee = landmarks[25]
        left_ankle = landmarks[27]
        left_hip = landmarks[23]

        knee_angle = self._calculate_angle(left_hip, left_knee, left_ankle)

        if knee_angle < 80:
            feedback.append("Bend your front knee more - aim for 90 degrees")
        elif knee_angle > 100:
            feedback.append("Don't bend your front knee too much")

        # Check if knee is over ankle
        if abs(left_knee['x'] - left_ankle['x']) > 0.05:
            feedback.append("Keep your front knee over your ankle")

        # Check arm alignment
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        if abs(left_wrist['y'] - left_shoulder['y']) > 0.1:
            feedback.append("Extend your left arm at shoulder height")

        if abs(right_wrist['y'] - right_shoulder['y']) > 0.1:
            feedback.append("Extend your right arm at shoulder height")

        if not feedback:
            feedback.append("Excellent Warrior II form!")

        return feedback

    def _analyze_tree_pose(self, landmarks: List[Dict]) -> List[str]:
        """Analyze Tree Pose"""
        feedback = []

        # Check balance - standing leg should be straight
        right_hip = landmarks[24]
        right_knee = landmarks[26]
        right_ankle = landmarks[28]

        knee_angle = self._calculate_angle(right_hip, right_knee, right_ankle)

        if knee_angle < 170:
            feedback.append("Keep your standing leg straight")

        # Check if raised foot is at proper height
        left_ankle = landmarks[27]
        if left_ankle['y'] > right_knee['y']:
            feedback.append("Try to raise your foot higher on the inner thigh")

        # Check hip alignment
        if abs(right_hip['y'] - landmarks[23]['y']) > 0.08:
            feedback.append("Keep your hips level")

        # Check if standing straight
        nose = landmarks[0]
        mid_hip = (landmarks[23]['x'] + landmarks[24]['x']) / 2
        if abs(nose['x'] - mid_hip) > 0.1:
            feedback.append("Center your body over your standing leg")

        if not feedback:
            feedback.append("Perfect balance! Keep it up")

        return feedback

    def _analyze_downward_dog(self, landmarks: List[Dict]) -> List[str]:
        """Analyze Downward Dog Pose"""
        feedback = []

        # Check if legs are straight
        left_knee_angle = self._calculate_angle(
            landmarks[23], landmarks[25], landmarks[27]
        )
        right_knee_angle = self._calculate_angle(
            landmarks[24], landmarks[26], landmarks[28]
        )

        if left_knee_angle < 160 or right_knee_angle < 160:
            feedback.append("Straighten your legs more")

        # Check if arms are straight
        left_elbow_angle = self._calculate_angle(
            landmarks[11], landmarks[13], landmarks[15]
        )
        right_elbow_angle = self._calculate_angle(
            landmarks[12], landmarks[14], landmarks[16]
        )

        if left_elbow_angle < 160 or right_elbow_angle < 160:
            feedback.append("Straighten your arms")

        # Check spine alignment
        nose = landmarks[0]
        mid_hip = (landmarks[23]['y'] + landmarks[24]['y']) / 2
        if nose['y'] > mid_hip:
            feedback.append("Lift your hips higher")

        if not feedback:
            feedback.append("Great Downward Dog!")

        return feedback

    def _analyze_plank(self, landmarks: List[Dict]) -> List[str]:
        """Analyze Plank Pose"""
        feedback = []

        # Check if body is in a straight line
        shoulders_y = (landmarks[11]['y'] + landmarks[12]['y']) / 2
        hips_y = (landmarks[23]['y'] + landmarks[24]['y']) / 2
        ankles_y = (landmarks[27]['y'] + landmarks[28]['y']) / 2

        # Check if hips are sagging
        if hips_y > shoulders_y + 0.1:
            feedback.append("Engage your core - don't let your hips sag")

        # Check if hips are too high
        if hips_y < shoulders_y - 0.05:
            feedback.append("Lower your hips - keep your body in a straight line")

        # Check if arms are straight
        left_elbow_angle = self._calculate_angle(
            landmarks[11], landmarks[13], landmarks[15]
        )
        right_elbow_angle = self._calculate_angle(
            landmarks[12], landmarks[14], landmarks[16]
        )

        if left_elbow_angle < 160 or right_elbow_angle < 160:
            feedback.append("Keep your arms straight")

        # Check shoulder alignment
        left_shoulder = landmarks[11]
        left_wrist = landmarks[15]
        if abs(left_shoulder['x'] - left_wrist['x']) > 0.1:
            feedback.append("Keep your shoulders over your wrists")

        if not feedback:
            feedback.append("Perfect plank form!")

        return feedback

    def _calculate_angle(self, point1: Dict, point2: Dict, point3: Dict) -> float:
        """Calculate angle between three points"""
        v1 = np.array([point1['x'] - point2['x'], point1['y'] - point2['y']])
        v2 = np.array([point3['x'] - point2['x'], point3['y'] - point2['y']])

        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)

        return np.degrees(angle)
