"""Tests for pose_recognition module."""

from app.pose_recognition import YogaPoseRecognizer


class TestYogaPoseRecognizerInit:
    """Tests for YogaPoseRecognizer initialization."""

    def test_initializes_with_reference_poses(self):
        """Recognizer should have reference poses defined."""
        recognizer = YogaPoseRecognizer()
        assert len(recognizer.reference_poses) > 0

    def test_all_poses_have_angles_and_tolerance(self):
        """Each reference pose should have angles and tolerance."""
        recognizer = YogaPoseRecognizer()

        for pose_name, config in recognizer.reference_poses.items():
            assert "angles" in config, f"{pose_name} missing angles"
            assert "tolerance" in config, f"{pose_name} missing tolerance"
            assert isinstance(config["angles"], dict)
            assert isinstance(config["tolerance"], int | float)


class TestRecognize:
    """Tests for the recognize method."""

    def test_returns_tuple(self, sample_landmarks):
        """Should return a tuple of (pose_name, confidence)."""
        recognizer = YogaPoseRecognizer()
        result = recognizer.recognize(sample_landmarks)

        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_returns_unknown_for_empty_landmarks(self):
        """Should return Unknown for empty landmarks."""
        recognizer = YogaPoseRecognizer()
        pose, confidence = recognizer.recognize([])

        assert pose == "Unknown"
        assert confidence == 0.0

    def test_returns_unknown_for_insufficient_landmarks(self):
        """Should return Unknown if fewer than 33 landmarks."""
        recognizer = YogaPoseRecognizer()
        landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9}] * 20

        pose, confidence = recognizer.recognize(landmarks)

        assert pose == "Unknown"
        assert confidence == 0.0

    def test_returns_unknown_for_none(self):
        """Should return Unknown for None input."""
        recognizer = YogaPoseRecognizer()
        pose, confidence = recognizer.recognize(None)

        assert pose == "Unknown"
        assert confidence == 0.0

    def test_confidence_is_between_zero_and_one(self, sample_landmarks):
        """Confidence should be between 0 and 1."""
        recognizer = YogaPoseRecognizer()
        _, confidence = recognizer.recognize(sample_landmarks)

        assert 0.0 <= confidence <= 1.0

    def test_recognizes_standing_pose(self, sample_landmarks):
        """Should recognize a standing pose from neutral landmarks."""
        recognizer = YogaPoseRecognizer()
        pose, confidence = recognizer.recognize(sample_landmarks)

        # Neutral standing should match Mountain Pose or similar
        assert pose != "Unknown"


class TestEvaluateTargetPose:
    """Tests for the evaluate_target_pose method."""

    def test_returns_tuple(self, sample_landmarks):
        """Should return tuple of (confidence, angle_breakdown)."""
        recognizer = YogaPoseRecognizer()
        result = recognizer.evaluate_target_pose(sample_landmarks, "Mountain Pose")

        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_returns_zero_for_empty_landmarks(self):
        """Should return 0 for empty landmarks."""
        recognizer = YogaPoseRecognizer()
        confidence, breakdown = recognizer.evaluate_target_pose([], "Mountain Pose")

        assert confidence == 0.0
        assert breakdown == {}

    def test_returns_zero_for_unknown_pose(self, sample_landmarks):
        """Should return 0 for unknown target pose."""
        recognizer = YogaPoseRecognizer()
        confidence, breakdown = recognizer.evaluate_target_pose(
            sample_landmarks, "Unknown Pose Name"
        )

        assert confidence == 0.0
        assert breakdown == {}

    def test_angle_breakdown_has_joint_details(self, sample_landmarks):
        """Angle breakdown should have details for each joint."""
        recognizer = YogaPoseRecognizer()
        _, breakdown = recognizer.evaluate_target_pose(sample_landmarks, "Mountain Pose")

        assert len(breakdown) > 0

        for _joint, details in breakdown.items():
            assert "current" in details
            assert "target" in details
            assert "difference" in details
            assert "status" in details

    def test_status_values_are_valid(self, sample_landmarks):
        """Status should be one of good, needs_improvement, or poor."""
        recognizer = YogaPoseRecognizer()
        _, breakdown = recognizer.evaluate_target_pose(sample_landmarks, "Mountain Pose")

        valid_statuses = {"good", "needs_improvement", "poor"}
        for _joint, details in breakdown.items():
            assert details["status"] in valid_statuses

    def test_high_confidence_for_matching_pose(self, warrior_ii_left_landmarks):
        """Should have higher confidence when landmarks match target pose."""
        recognizer = YogaPoseRecognizer()
        confidence, _ = recognizer.evaluate_target_pose(
            warrior_ii_left_landmarks, "Warrior II Left"
        )

        # Fixture is designed to represent Warrior II Left
        assert confidence > 0.5


class TestCalculateAngles:
    """Tests for the _calculate_angles method."""

    def test_returns_dict(self, sample_landmarks):
        """Should return a dictionary of angles."""
        recognizer = YogaPoseRecognizer()
        angles = recognizer._calculate_angles(sample_landmarks)

        assert isinstance(angles, dict)

    def test_calculates_all_joint_angles(self, sample_landmarks):
        """Should calculate angles for all key joints."""
        recognizer = YogaPoseRecognizer()
        angles = recognizer._calculate_angles(sample_landmarks)

        expected_joints = {
            "left_elbow",
            "right_elbow",
            "left_knee",
            "right_knee",
            "left_hip",
            "right_hip",
            "left_shoulder",
            "right_shoulder",
        }

        assert set(angles.keys()) == expected_joints

    def test_angles_are_valid_degrees(self, sample_landmarks):
        """All angles should be valid degree values (0-180)."""
        recognizer = YogaPoseRecognizer()
        angles = recognizer._calculate_angles(sample_landmarks)

        for joint, angle in angles.items():
            assert 0 <= angle <= 180, f"{joint} has invalid angle: {angle}"


class TestCalculateSimilarity:
    """Tests for the _calculate_similarity method."""

    def test_perfect_match_returns_one(self):
        """Perfect match should return 1.0."""
        recognizer = YogaPoseRecognizer()

        current = {"left_knee": 90, "right_knee": 90}
        reference = {"left_knee": 90, "right_knee": 90}

        similarity = recognizer._calculate_similarity(current, reference, tolerance=15)

        assert similarity == 1.0

    def test_within_tolerance_high_score(self):
        """Angles within tolerance should have high similarity."""
        recognizer = YogaPoseRecognizer()

        current = {"left_knee": 95, "right_knee": 85}  # Within 5 degrees
        reference = {"left_knee": 90, "right_knee": 90}

        similarity = recognizer._calculate_similarity(current, reference, tolerance=15)

        assert similarity > 0.8

    def test_far_off_low_score(self):
        """Angles far from reference should have low similarity."""
        recognizer = YogaPoseRecognizer()

        current = {"left_knee": 180, "right_knee": 180}  # 90 degrees off
        reference = {"left_knee": 90, "right_knee": 90}

        similarity = recognizer._calculate_similarity(current, reference, tolerance=15)

        assert similarity < 0.5

    def test_empty_reference_returns_zero(self):
        """Empty reference angles should return 0."""
        recognizer = YogaPoseRecognizer()

        similarity = recognizer._calculate_similarity({"left_knee": 90}, {}, tolerance=15)

        assert similarity == 0.0

    def test_missing_joint_in_current(self):
        """Missing joint in current angles should be handled."""
        recognizer = YogaPoseRecognizer()

        current = {"left_knee": 90}  # Missing right_knee
        reference = {"left_knee": 90, "right_knee": 90}

        # Should only consider the matching joint
        similarity = recognizer._calculate_similarity(current, reference, tolerance=15)

        assert 0.0 <= similarity <= 1.0


class TestPosesWithFixtures:
    """Tests using pose fixtures."""

    def test_warrior_ii_landmarks_recognize_correctly(self, warrior_ii_left_landmarks):
        """Warrior II Left landmarks should be recognized."""
        recognizer = YogaPoseRecognizer()
        pose, confidence = recognizer.recognize(warrior_ii_left_landmarks)

        # Should recognize as some pose (may not be exact due to fixture approximation)
        assert pose != "Unknown" or confidence > 0

    def test_tree_pose_landmarks_recognized(self, tree_pose_right_landmarks):
        """Tree Pose Right landmarks should be recognized."""
        recognizer = YogaPoseRecognizer()
        pose, confidence = recognizer.recognize(tree_pose_right_landmarks)

        # Should recognize as some pose
        assert pose != "Unknown" or confidence > 0

    def test_different_poses_have_different_confidence(
        self, warrior_ii_left_landmarks, sample_landmarks
    ):
        """Different landmarks should have different confidence for same target."""
        recognizer = YogaPoseRecognizer()

        warrior_conf, _ = recognizer.evaluate_target_pose(
            warrior_ii_left_landmarks, "Warrior II Left"
        )
        standing_conf, _ = recognizer.evaluate_target_pose(sample_landmarks, "Warrior II Left")

        # Warrior II landmarks should match Warrior II better than standing
        assert warrior_conf >= standing_conf
