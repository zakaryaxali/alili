from .utils.geometry import calculate_angle


class PoseQualityAnalyzer:
    """Analyze pose quality and provide feedback"""

    def __init__(self):
        self.feedback_rules = {
            "Mountain Pose": self._analyze_mountain_pose,
            "Warrior II Left": self._analyze_warrior_two_left,
            "Warrior II Right": self._analyze_warrior_two_right,
            "Tree Pose Left": self._analyze_tree_pose_left,
            "Tree Pose Right": self._analyze_tree_pose_right,
            "Downward Dog": self._analyze_downward_dog,
            "Plank": self._analyze_plank,
            "Supine Bound Angle": self._analyze_supine_bound_angle,
            "Hug the Knees": self._analyze_hug_knees,
            "Easy Seat": self._analyze_easy_seat,
            "Seated Hands Behind Back Stretch": self._analyze_seated_back_stretch,
            "Gomukasana Legs Fold": self._analyze_gomukasana_legs,
            "Janu Sirsasana Twist Left": self._analyze_janu_twist_left,
            "Janu Sirsasana Twist Right": self._analyze_janu_twist_right,
            "Janu Sirsasana Revolved Left": self._analyze_janu_revolved_left,
            "Janu Sirsasana Revolved Right": self._analyze_janu_revolved_right,
            "Reverse Table Top": self._analyze_reverse_table,
            "Supine Bent Knees": self._analyze_supine_bent_knees,
        }

    def analyze(self, pose_name: str, landmarks: list[dict]) -> list[str]:
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

    def _analyze_mountain_pose(self, landmarks: list[dict]) -> list[str]:
        """Analyze Mountain Pose (Tadasana)"""
        feedback = []

        # Check if shoulders are level
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        shoulder_diff = abs(left_shoulder["y"] - right_shoulder["y"])

        if shoulder_diff > 0.05:
            if left_shoulder["y"] < right_shoulder["y"]:
                feedback.append("Level your shoulders - right shoulder is lower")
            else:
                feedback.append("Level your shoulders - left shoulder is lower")

        # Check if hips are level
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        hip_diff = abs(left_hip["y"] - right_hip["y"])

        if hip_diff > 0.05:
            feedback.append("Keep your hips level")

        # Check if standing straight
        left_knee = landmarks[25]
        left_ankle = landmarks[27]
        if abs(left_knee["x"] - left_ankle["x"]) > 0.1:
            feedback.append("Keep your legs straight and aligned")

        if not feedback:
            feedback.append("Great form! Maintain this position")

        return feedback

    def _analyze_warrior_two_left(self, landmarks: list[dict]) -> list[str]:
        """Analyze Warrior II Pose (Left leg forward)"""
        feedback = []

        # Check front knee alignment (left leg)
        left_knee = landmarks[25]
        left_ankle = landmarks[27]
        left_hip = landmarks[23]

        knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

        if knee_angle < 80:
            feedback.append("Bend your left knee more - aim for 90 degrees")
        elif knee_angle > 100:
            feedback.append("Don't bend your left knee too much")

        # Check if knee is over ankle
        if abs(left_knee["x"] - left_ankle["x"]) > 0.05:
            feedback.append("Keep your left knee over your ankle")

        # Check arm alignment
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        if abs(left_wrist["y"] - left_shoulder["y"]) > 0.1:
            feedback.append("Extend your left arm at shoulder height")

        if abs(right_wrist["y"] - right_shoulder["y"]) > 0.1:
            feedback.append("Extend your right arm at shoulder height")

        if not feedback:
            feedback.append("Excellent Warrior II Left form!")

        return feedback

    def _analyze_warrior_two_right(self, landmarks: list[dict]) -> list[str]:
        """Analyze Warrior II Pose (Right leg forward)"""
        feedback = []

        # Check front knee alignment (right leg)
        right_knee = landmarks[26]
        right_ankle = landmarks[28]
        right_hip = landmarks[24]

        knee_angle = calculate_angle(right_hip, right_knee, right_ankle)

        if knee_angle < 80:
            feedback.append("Bend your right knee more - aim for 90 degrees")
        elif knee_angle > 100:
            feedback.append("Don't bend your right knee too much")

        # Check if knee is over ankle
        if abs(right_knee["x"] - right_ankle["x"]) > 0.05:
            feedback.append("Keep your right knee over your ankle")

        # Check arm alignment
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        if abs(left_wrist["y"] - left_shoulder["y"]) > 0.1:
            feedback.append("Extend your left arm at shoulder height")

        if abs(right_wrist["y"] - right_shoulder["y"]) > 0.1:
            feedback.append("Extend your right arm at shoulder height")

        if not feedback:
            feedback.append("Excellent Warrior II Right form!")

        return feedback

    def _analyze_tree_pose_left(self, landmarks: list[dict]) -> list[str]:
        """Analyze Tree Pose (Standing on left leg)"""
        feedback = []

        # Check balance - left standing leg should be straight
        left_hip = landmarks[23]
        left_knee = landmarks[25]
        left_ankle = landmarks[27]

        knee_angle = calculate_angle(left_hip, left_knee, left_ankle)

        if knee_angle < 170:
            feedback.append("Keep your left standing leg straight")

        # Check if raised foot is at proper height
        right_ankle = landmarks[28]
        if right_ankle["y"] > left_knee["y"]:
            feedback.append("Try to raise your right foot higher on the inner thigh")

        # Check hip alignment
        if abs(left_hip["y"] - landmarks[24]["y"]) > 0.08:
            feedback.append("Keep your hips level")

        # Check if standing straight
        nose = landmarks[0]
        mid_hip = (landmarks[23]["x"] + landmarks[24]["x"]) / 2
        if abs(nose["x"] - mid_hip) > 0.1:
            feedback.append("Center your body over your left leg")

        if not feedback:
            feedback.append("Perfect balance on your left leg! Keep it up")

        return feedback

    def _analyze_tree_pose_right(self, landmarks: list[dict]) -> list[str]:
        """Analyze Tree Pose (Standing on right leg)"""
        feedback = []

        # Check balance - right standing leg should be straight
        right_hip = landmarks[24]
        right_knee = landmarks[26]
        right_ankle = landmarks[28]

        knee_angle = calculate_angle(right_hip, right_knee, right_ankle)

        if knee_angle < 170:
            feedback.append("Keep your right standing leg straight")

        # Check if raised foot is at proper height
        left_ankle = landmarks[27]
        if left_ankle["y"] > right_knee["y"]:
            feedback.append("Try to raise your left foot higher on the inner thigh")

        # Check hip alignment
        if abs(right_hip["y"] - landmarks[23]["y"]) > 0.08:
            feedback.append("Keep your hips level")

        # Check if standing straight
        nose = landmarks[0]
        mid_hip = (landmarks[23]["x"] + landmarks[24]["x"]) / 2
        if abs(nose["x"] - mid_hip) > 0.1:
            feedback.append("Center your body over your right leg")

        if not feedback:
            feedback.append("Perfect balance on your right leg! Keep it up")

        return feedback

    def _analyze_downward_dog(self, landmarks: list[dict]) -> list[str]:
        """Analyze Downward Dog Pose"""
        feedback = []

        # Check if legs are straight
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if left_knee_angle < 160 or right_knee_angle < 160:
            feedback.append("Straighten your legs more")

        # Check if arms are straight
        left_elbow_angle = calculate_angle(landmarks[11], landmarks[13], landmarks[15])
        right_elbow_angle = calculate_angle(landmarks[12], landmarks[14], landmarks[16])

        if left_elbow_angle < 160 or right_elbow_angle < 160:
            feedback.append("Straighten your arms")

        # Check spine alignment
        nose = landmarks[0]
        mid_hip = (landmarks[23]["y"] + landmarks[24]["y"]) / 2
        if nose["y"] > mid_hip:
            feedback.append("Lift your hips higher")

        if not feedback:
            feedback.append("Great Downward Dog!")

        return feedback

    def _analyze_plank(self, landmarks: list[dict]) -> list[str]:
        """Analyze Plank Pose"""
        feedback = []

        # Check if body is in a straight line
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2

        # Check if hips are sagging
        if hips_y > shoulders_y + 0.1:
            feedback.append("Engage your core - don't let your hips sag")

        # Check if hips are too high
        if hips_y < shoulders_y - 0.05:
            feedback.append("Lower your hips - keep your body in a straight line")

        # Check if arms are straight
        left_elbow_angle = calculate_angle(landmarks[11], landmarks[13], landmarks[15])
        right_elbow_angle = calculate_angle(landmarks[12], landmarks[14], landmarks[16])

        if left_elbow_angle < 160 or right_elbow_angle < 160:
            feedback.append("Keep your arms straight")

        # Check shoulder alignment
        left_shoulder = landmarks[11]
        left_wrist = landmarks[15]
        if abs(left_shoulder["x"] - left_wrist["x"]) > 0.1:
            feedback.append("Keep your shoulders over your wrists")

        if not feedback:
            feedback.append("Perfect plank form!")

        return feedback

    def _analyze_supine_bound_angle(self, landmarks: list[dict]) -> list[str]:
        """Analyze Supine Bound Angle Pose (Baddha Konasana)"""
        feedback = []

        # Check knee bend
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if left_knee_angle < 40 or right_knee_angle < 40:
            feedback.append("Let your knees fall outward naturally")
        elif left_knee_angle > 70 or right_knee_angle > 70:
            feedback.append("Bring the soles of your feet closer together")

        # Check hip symmetry
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        if abs(left_hip["y"] - right_hip["y"]) > 0.08:
            feedback.append("Keep your hips level and relaxed")

        if not feedback:
            feedback.append("Excellent! Breathe deeply and relax into the pose")

        return feedback

    def _analyze_hug_knees(self, landmarks: list[dict]) -> list[str]:
        """Analyze Hug the Knees Pose"""
        feedback = []

        # Check if knees are pulled to chest
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        nose = landmarks[0]

        # Knees should be close to upper body
        if left_knee["y"] > nose["y"] + 0.2 or right_knee["y"] > nose["y"] + 0.2:
            feedback.append("Draw your knees closer to your chest")

        # Check knee symmetry
        if abs(left_knee["y"] - right_knee["y"]) > 0.1:
            feedback.append("Keep both knees at the same height")

        # Check shoulder relaxation
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        if abs(left_shoulder["y"] - right_shoulder["y"]) > 0.08:
            feedback.append("Relax your shoulders and keep them level")

        if not feedback:
            feedback.append("Great! Keep breathing and gently hug your knees")

        return feedback

    def _analyze_easy_seat(self, landmarks: list[dict]) -> list[str]:
        """Analyze Easy Seat Pose (Sukhasana)"""
        feedback = []

        # Check if sitting upright - shoulders above hips
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2

        if shoulders_y > hips_y + 0.05:
            feedback.append("Sit up taller - lengthen your spine")

        # Check shoulder level
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        if abs(left_shoulder["y"] - right_shoulder["y"]) > 0.08:
            feedback.append("Level your shoulders")

        # Check hip level
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        if abs(left_hip["y"] - right_hip["y"]) > 0.08:
            feedback.append("Balance your weight evenly on both hips")

        if not feedback:
            feedback.append("Perfect seated posture! Stay grounded and tall")

        return feedback

    def _analyze_seated_back_stretch(self, landmarks: list[dict]) -> list[str]:
        """Analyze Seated Hands Behind Back Stretch"""
        feedback = []

        # Check if chest is open - shoulders back
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_elbow = landmarks[13]

        # Elbows should be behind shoulders for proper stretch
        if left_elbow["x"] < left_shoulder["x"] + 0.05:
            feedback.append("Move your hands further behind your back")

        # Check shoulder level
        if abs(left_shoulder["y"] - right_shoulder["y"]) > 0.08:
            feedback.append("Keep your shoulders level")

        # Check spine alignment - sitting tall
        mid_hip = (landmarks[23]["y"] + landmarks[24]["y"]) / 2
        shoulders_y = (left_shoulder["y"] + right_shoulder["y"]) / 2

        if shoulders_y > mid_hip + 0.05:
            feedback.append("Sit up taller and lengthen your spine")

        if not feedback:
            feedback.append("Excellent chest opening! Feel the stretch")

        return feedback

    def _analyze_gomukasana_legs(self, landmarks: list[dict]) -> list[str]:
        """Analyze Gomukasana Legs Fold (Cow Face Pose Legs)"""
        feedback = []

        # Check knee alignment - knees should be stacked
        left_knee = landmarks[25]
        right_knee = landmarks[26]

        knee_distance = abs(left_knee["x"] - right_knee["x"])
        if knee_distance > 0.15:
            feedback.append("Bring your knees closer together - stack them")

        # Check if sitting upright
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2

        if shoulders_y > hips_y + 0.05:
            feedback.append("Sit up tall - keep your spine straight")

        # Check hip alignment
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        if abs(left_hip["y"] - right_hip["y"]) > 0.1:
            feedback.append("Keep your hips square and balanced")

        if not feedback:
            feedback.append("Great leg position! Hold and breathe")

        return feedback

    def _analyze_janu_twist_left(self, landmarks: list[dict]) -> list[str]:
        """Analyze Janu Sirsasana Twist (Left leg extended)"""
        feedback = []

        # Check if left leg is extended
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        # Left leg should be straight (180°), right bent (90°)
        if left_knee_angle < 160:
            feedback.append("Extend your left leg straight out in front")
        if right_knee_angle > 100:
            feedback.append("Bend your right knee more and bring foot to inner thigh")

        # Check spine rotation - shoulders should be different heights
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        shoulder_diff = abs(left_shoulder["y"] - right_shoulder["y"])

        if shoulder_diff < 0.05:
            feedback.append("Twist deeper - rotate your torso toward the left")

        # Check forward fold over left leg
        nose = landmarks[0]
        left_ankle = landmarks[27]
        if nose["y"] > left_ankle["y"] - 0.2:
            feedback.append("Fold forward over your left leg")

        if not feedback:
            feedback.append("Beautiful twist to the left! Breathe into the stretch")

        return feedback

    def _analyze_janu_twist_right(self, landmarks: list[dict]) -> list[str]:
        """Analyze Janu Sirsasana Twist (Right leg extended)"""
        feedback = []

        # Check if right leg is extended
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        # Right leg should be straight (180°), left bent (90°)
        if right_knee_angle < 160:
            feedback.append("Extend your right leg straight out in front")
        if left_knee_angle > 100:
            feedback.append("Bend your left knee more and bring foot to inner thigh")

        # Check spine rotation - shoulders should be different heights
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        shoulder_diff = abs(left_shoulder["y"] - right_shoulder["y"])

        if shoulder_diff < 0.05:
            feedback.append("Twist deeper - rotate your torso toward the right")

        # Check forward fold over right leg
        nose = landmarks[0]
        right_ankle = landmarks[28]
        if nose["y"] > right_ankle["y"] - 0.2:
            feedback.append("Fold forward over your right leg")

        if not feedback:
            feedback.append("Beautiful twist to the right! Breathe into the stretch")

        return feedback

    def _analyze_janu_revolved_left(self, landmarks: list[dict]) -> list[str]:
        """Analyze Janu Sirsasana Revolved (Left leg extended)"""
        feedback = []

        # Check leg position - left straight, right bent
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if left_knee_angle < 160:
            feedback.append("Straighten your left leg fully")
        if right_knee_angle > 100:
            feedback.append("Bend your right knee to the side")

        # Check forward fold depth
        nose = landmarks[0]
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2

        if nose["y"] > hips_y:
            feedback.append("Fold deeper from your hips - hinge forward over left leg")

        # Check spine alignment during fold
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2
        if shoulders_y > hips_y + 0.05:
            feedback.append("Keep lengthening your spine as you fold")

        if not feedback:
            feedback.append("Perfect forward fold over left leg! Hold and breathe")

        return feedback

    def _analyze_janu_revolved_right(self, landmarks: list[dict]) -> list[str]:
        """Analyze Janu Sirsasana Revolved (Right leg extended)"""
        feedback = []

        # Check leg position - right straight, left bent
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if right_knee_angle < 160:
            feedback.append("Straighten your right leg fully")
        if left_knee_angle > 100:
            feedback.append("Bend your left knee to the side")

        # Check forward fold depth
        nose = landmarks[0]
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2

        if nose["y"] > hips_y:
            feedback.append("Fold deeper from your hips - hinge forward over right leg")

        # Check spine alignment during fold
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2
        if shoulders_y > hips_y + 0.05:
            feedback.append("Keep lengthening your spine as you fold")

        if not feedback:
            feedback.append("Perfect forward fold over right leg! Hold and breathe")

        return feedback

    def _analyze_reverse_table(self, landmarks: list[dict]) -> list[str]:
        """Analyze Reverse Table Top Pose"""
        feedback = []

        # Check if hips are lifted
        hips_y = (landmarks[23]["y"] + landmarks[24]["y"]) / 2
        shoulders_y = (landmarks[11]["y"] + landmarks[12]["y"]) / 2

        if hips_y > shoulders_y:
            feedback.append("Lift your hips higher - press through your hands")

        # Check if arms are straight
        left_elbow_angle = calculate_angle(landmarks[11], landmarks[13], landmarks[15])
        right_elbow_angle = calculate_angle(landmarks[12], landmarks[14], landmarks[16])

        if left_elbow_angle < 160 or right_elbow_angle < 160:
            feedback.append("Straighten your arms - press firmly into the ground")

        # Check knee alignment
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if left_knee_angle < 80 or right_knee_angle < 80:
            feedback.append("Keep your knees at 90 degrees - shins vertical")

        # Check hip level
        if abs(landmarks[23]["y"] - landmarks[24]["y"]) > 0.08:
            feedback.append("Keep your hips level")

        if not feedback:
            feedback.append("Excellent form! Engage your core")

        return feedback

    def _analyze_supine_bent_knees(self, landmarks: list[dict]) -> list[str]:
        """Analyze Supine Bent Knees Pose"""
        feedback = []

        # Check knee bend angle
        left_knee_angle = calculate_angle(landmarks[23], landmarks[25], landmarks[27])
        right_knee_angle = calculate_angle(landmarks[24], landmarks[26], landmarks[28])

        if left_knee_angle < 70 or right_knee_angle < 70:
            feedback.append("Let your knees bend more comfortably")
        elif left_knee_angle > 110 or right_knee_angle > 110:
            feedback.append("Bring your feet closer to your hips")

        # Check knee alignment - should be hip-width apart
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        knee_distance = abs(left_knee["x"] - right_knee["x"])

        if knee_distance < 0.1:
            feedback.append("Widen your knees to hip-width apart")
        elif knee_distance > 0.3:
            feedback.append("Bring your knees closer together")

        # Check shoulder relaxation
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        if abs(left_shoulder["y"] - right_shoulder["y"]) > 0.08:
            feedback.append("Relax your shoulders flat on the ground")

        if not feedback:
            feedback.append("Perfect! Relax and breathe deeply")

        return feedback
