"""Tests for body_parts module."""

from app.body_parts import (
    ASYMMETRIC_POSE_PAIRS,
    BODY_PART_POSES,
    COOLDOWN_POSES,
    PEAK_POSES,
    POSE_METADATA,
    WARMUP_POSES,
    get_pose_pair,
    get_poses_for_body_parts,
    is_asymmetric_pose,
)


class TestPoseMetadata:
    """Tests for POSE_METADATA constant."""

    def test_all_poses_have_required_fields(self):
        """Every pose must have base_duration, difficulty, and targets."""
        for pose_name, metadata in POSE_METADATA.items():
            assert "base_duration" in metadata, f"{pose_name} missing base_duration"
            assert "difficulty" in metadata, f"{pose_name} missing difficulty"
            assert "targets" in metadata, f"{pose_name} missing targets"

    def test_difficulty_values_are_valid(self):
        """Difficulty should be 'easy', 'medium', or 'hard'."""
        valid_difficulties = {"easy", "medium", "hard"}
        for pose_name, metadata in POSE_METADATA.items():
            assert (
                metadata["difficulty"] in valid_difficulties
            ), f"{pose_name} has invalid difficulty: {metadata['difficulty']}"

    def test_base_duration_is_positive(self):
        """Base duration should be a positive number."""
        for pose_name, metadata in POSE_METADATA.items():
            assert metadata["base_duration"] > 0, f"{pose_name} has non-positive duration"

    def test_targets_is_non_empty_list(self):
        """Each pose should target at least one body part."""
        for pose_name, metadata in POSE_METADATA.items():
            assert isinstance(metadata["targets"], list), f"{pose_name} targets is not a list"
            assert len(metadata["targets"]) > 0, f"{pose_name} has no targets"


class TestBodyPartPoses:
    """Tests for BODY_PART_POSES mapping."""

    def test_all_body_parts_have_poses(self):
        """Each body part should map to at least one pose."""
        for body_part, poses in BODY_PART_POSES.items():
            assert len(poses) > 0, f"Body part {body_part} has no poses"

    def test_poses_exist_in_metadata(self):
        """All poses referenced in mappings should exist in POSE_METADATA."""
        for body_part, poses in BODY_PART_POSES.items():
            for pose in poses:
                assert pose in POSE_METADATA, f"Pose '{pose}' for {body_part} not in POSE_METADATA"


class TestAsymmetricPosePairs:
    """Tests for asymmetric pose pairs."""

    def test_pairs_exist_in_metadata(self):
        """Both poses in each pair should exist in POSE_METADATA."""
        for left, right in ASYMMETRIC_POSE_PAIRS:
            assert left in POSE_METADATA, f"Left pose '{left}' not in POSE_METADATA"
            assert right in POSE_METADATA, f"Right pose '{right}' not in POSE_METADATA"

    def test_pairs_have_same_metadata(self):
        """Paired poses should have the same duration and difficulty."""
        for left, right in ASYMMETRIC_POSE_PAIRS:
            left_meta = POSE_METADATA[left]
            right_meta = POSE_METADATA[right]
            assert (
                left_meta["base_duration"] == right_meta["base_duration"]
            ), f"Pair {left}/{right} has different durations"
            assert (
                left_meta["difficulty"] == right_meta["difficulty"]
            ), f"Pair {left}/{right} has different difficulties"


class TestFlowCategories:
    """Tests for pose flow categories (warmup, peak, cooldown)."""

    def test_warmup_poses_exist(self):
        """All warmup poses should exist in POSE_METADATA."""
        for pose in WARMUP_POSES:
            assert pose in POSE_METADATA, f"Warmup pose '{pose}' not in POSE_METADATA"

    def test_peak_poses_exist(self):
        """All peak poses should exist in POSE_METADATA."""
        for pose in PEAK_POSES:
            assert pose in POSE_METADATA, f"Peak pose '{pose}' not in POSE_METADATA"

    def test_cooldown_poses_exist(self):
        """All cooldown poses should exist in POSE_METADATA."""
        for pose in COOLDOWN_POSES:
            assert pose in POSE_METADATA, f"Cooldown pose '{pose}' not in POSE_METADATA"


class TestGetPosesForBodyParts:
    """Tests for get_poses_for_body_parts function."""

    def test_single_body_part(self):
        """Should return poses for a single body part."""
        poses = get_poses_for_body_parts(["neck"])
        assert len(poses) > 0
        assert all(pose in POSE_METADATA for pose in poses)

    def test_multiple_body_parts(self):
        """Should return combined poses for multiple body parts."""
        poses = get_poses_for_body_parts(["neck", "shoulders"])
        # Should include poses from both body parts
        neck_poses = set(BODY_PART_POSES["neck"])
        shoulder_poses = set(BODY_PART_POSES["shoulders"])
        expected = neck_poses | shoulder_poses
        assert set(poses) == expected

    def test_empty_input_returns_empty(self):
        """Empty body parts list should return empty list."""
        poses = get_poses_for_body_parts([])
        assert poses == []

    def test_unknown_body_part_ignored(self):
        """Unknown body parts should be ignored."""
        poses = get_poses_for_body_parts(["unknown_body_part"])
        assert poses == []

    def test_mixed_valid_and_invalid(self):
        """Should return poses for valid body parts, ignoring invalid ones."""
        poses = get_poses_for_body_parts(["neck", "unknown_body_part"])
        assert set(poses) == set(BODY_PART_POSES["neck"])

    def test_returns_unique_poses(self):
        """Should not return duplicate poses."""
        # hips and flexibility both include Supine Bound Angle
        poses = get_poses_for_body_parts(["hips", "flexibility"])
        assert len(poses) == len(set(poses))


class TestIsAsymmetricPose:
    """Tests for is_asymmetric_pose function."""

    def test_left_pose_is_asymmetric(self):
        """Left variant of asymmetric pose should return True."""
        assert is_asymmetric_pose("Warrior II Left") is True
        assert is_asymmetric_pose("Tree Pose Left") is True

    def test_right_pose_is_asymmetric(self):
        """Right variant of asymmetric pose should return True."""
        assert is_asymmetric_pose("Warrior II Right") is True
        assert is_asymmetric_pose("Tree Pose Right") is True

    def test_symmetric_pose_returns_false(self):
        """Symmetric poses should return False."""
        assert is_asymmetric_pose("Mountain Pose") is False
        assert is_asymmetric_pose("Downward Dog") is False
        assert is_asymmetric_pose("Plank") is False

    def test_unknown_pose_returns_false(self):
        """Unknown pose names should return False."""
        assert is_asymmetric_pose("Unknown Pose") is False


class TestGetPosePair:
    """Tests for get_pose_pair function."""

    def test_left_returns_right(self):
        """Getting pair of left pose should return right variant."""
        assert get_pose_pair("Warrior II Left") == "Warrior II Right"
        assert get_pose_pair("Tree Pose Left") == "Tree Pose Right"

    def test_right_returns_left(self):
        """Getting pair of right pose should return left variant."""
        assert get_pose_pair("Warrior II Right") == "Warrior II Left"
        assert get_pose_pair("Tree Pose Right") == "Tree Pose Left"

    def test_symmetric_pose_returns_none(self):
        """Symmetric poses should return None."""
        assert get_pose_pair("Mountain Pose") is None
        assert get_pose_pair("Downward Dog") is None

    def test_unknown_pose_returns_none(self):
        """Unknown pose names should return None."""
        assert get_pose_pair("Unknown Pose") is None
