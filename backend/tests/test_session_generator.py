"""Tests for session_generator module."""

from app.session_generator import _order_poses, generate_session, get_session_preview


class TestGenerateSession:
    """Tests for generate_session function."""

    def test_returns_required_fields(self):
        """Session should have all required fields."""
        session = generate_session(["neck"], [], 10)

        assert "id" in session
        assert "poses" in session
        assert "total_duration" in session
        assert "num_poses" in session
        assert "pain_areas" in session
        assert "improvement_areas" in session

    def test_session_id_is_uuid(self):
        """Session ID should be a valid UUID string."""
        session = generate_session(["neck"], [], 10)
        # UUID4 format: 8-4-4-4-12 hex characters
        assert len(session["id"]) == 36
        assert session["id"].count("-") == 4

    def test_total_duration_matches_input(self):
        """Total duration should match the requested duration."""
        session = generate_session(["neck"], [], 15)
        assert session["total_duration"] == 15

    def test_empty_body_parts_returns_default_poses(self):
        """Empty pain and improvement areas should return default poses."""
        session = generate_session([], [], 10)

        pose_names = [p["pose_name"] for p in session["poses"]]
        assert len(pose_names) >= 5  # Default sequence has 8 poses

    def test_pain_areas_stored(self):
        """Session should store pain areas."""
        session = generate_session(["neck", "shoulders"], [], 10)
        assert session["pain_areas"] == ["neck", "shoulders"]

    def test_improvement_areas_stored(self):
        """Session should store improvement areas."""
        session = generate_session([], ["balance", "core"], 10)
        assert session["improvement_areas"] == ["balance", "core"]

    def test_pose_has_required_fields(self):
        """Each pose should have required fields."""
        session = generate_session(["neck"], [], 10)

        for pose in session["poses"]:
            assert "pose_name" in pose
            assert "duration" in pose
            assert "order" in pose
            assert "is_pain_target" in pose
            assert "is_improvement_target" in pose

    def test_pose_order_is_sequential(self):
        """Pose order should be sequential starting from 1."""
        session = generate_session(["hips"], [], 10)

        orders = [p["order"] for p in session["poses"]]
        assert orders == list(range(1, len(orders) + 1))

    def test_num_poses_matches_pose_count(self):
        """num_poses should match the actual pose count."""
        session = generate_session(["neck"], [], 10)
        assert session["num_poses"] == len(session["poses"])


class TestPainTargetBonus:
    """Tests for pain target duration bonus."""

    def test_pain_target_marked(self):
        """Poses targeting pain areas should be marked."""
        session = generate_session(["neck"], [], 10)

        pain_poses = [p for p in session["poses"] if p["is_pain_target"]]
        assert len(pain_poses) > 0

    def test_improvement_target_marked(self):
        """Poses targeting improvement areas should be marked."""
        session = generate_session([], ["balance"], 10)

        improvement_poses = [p for p in session["poses"] if p["is_improvement_target"]]
        assert len(improvement_poses) > 0


class TestAsymmetricPosePairing:
    """Tests for asymmetric pose auto-pairing."""

    def test_warrior_ii_both_sides_included(self):
        """If Warrior II Left is selected, Right should also be included."""
        # hips targets Warrior II poses
        session = generate_session(["hips"], [], 10)
        pose_names = [p["pose_name"] for p in session["poses"]]

        if "Warrior II Left" in pose_names:
            assert "Warrior II Right" in pose_names

    def test_tree_pose_both_sides_included(self):
        """If Tree Pose Left is selected, Right should also be included."""
        # balance targets Tree Pose
        session = generate_session([], ["balance"], 10)
        pose_names = [p["pose_name"] for p in session["poses"]]

        if "Tree Pose Left" in pose_names:
            assert "Tree Pose Right" in pose_names

    def test_paired_poses_both_in_session(self):
        """Both sides of paired poses should be in the session."""
        session = generate_session(["hips"], [], 10)
        pose_names = [p["pose_name"] for p in session["poses"]]

        # Both sides should be present, though they may not be adjacent
        # after ordering into warmup/peak/cooldown
        has_warrior_left = "Warrior II Left" in pose_names
        has_warrior_right = "Warrior II Right" in pose_names

        # If one is present, both should be present
        assert has_warrior_left == has_warrior_right


class TestPoseOrdering:
    """Tests for _order_poses function."""

    def test_warmup_before_peak(self):
        """Warmup poses should come before peak poses."""
        poses = ["Downward Dog", "Mountain Pose", "Plank"]
        ordered = _order_poses(poses)

        mountain_idx = ordered.index("Mountain Pose")
        downward_idx = ordered.index("Downward Dog")

        assert mountain_idx < downward_idx

    def test_peak_before_cooldown(self):
        """Peak poses should come before cooldown poses."""
        poses = ["Supine Bound Angle", "Downward Dog", "Plank"]
        ordered = _order_poses(poses)

        supine_idx = ordered.index("Supine Bound Angle")
        downward_idx = ordered.index("Downward Dog")

        assert downward_idx < supine_idx

    def test_empty_list_returns_empty(self):
        """Empty input should return empty output."""
        assert _order_poses([]) == []

    def test_all_warmup_poses_at_start(self):
        """All warmup poses should be at the start."""
        poses = ["Plank", "Mountain Pose", "Easy Seat", "Downward Dog"]
        ordered = _order_poses(poses)

        # Mountain Pose is warmup
        mountain_idx = ordered.index("Mountain Pose")
        plank_idx = ordered.index("Plank")
        assert mountain_idx < plank_idx

    def test_all_cooldown_poses_at_end(self):
        """All cooldown poses should be at the end."""
        poses = ["Hug the Knees", "Downward Dog", "Supine Bent Knees"]
        ordered = _order_poses(poses)

        # Cooldown poses should be after peak
        downward_idx = ordered.index("Downward Dog")
        hug_idx = ordered.index("Hug the Knees")
        supine_idx = ordered.index("Supine Bent Knees")

        assert downward_idx < hug_idx
        assert downward_idx < supine_idx


class TestDurationScaling:
    """Tests for duration scaling to fit session time."""

    def test_total_duration_approximately_matches_target(self):
        """Total pose durations plus transitions should approximate target."""
        session = generate_session(["neck"], [], 10)

        total_pose_time = sum(p["duration"] for p in session["poses"])
        transition_time = (len(session["poses"]) - 1) * 5  # 5s between poses
        total_time = total_pose_time + transition_time

        # Should be within 60 seconds of target (10 minutes = 600 seconds)
        assert abs(total_time - 600) < 60

    def test_longer_session_has_longer_durations(self):
        """Longer session should have longer pose durations."""
        short_session = generate_session(["neck"], [], 10)
        long_session = generate_session(["neck"], [], 30)

        short_total = sum(p["duration"] for p in short_session["poses"])
        long_total = sum(p["duration"] for p in long_session["poses"])

        assert long_total > short_total


class TestGetSessionPreview:
    """Tests for get_session_preview function."""

    def test_returns_required_fields(self):
        """Preview should have all required fields."""
        preview = get_session_preview(["neck"], [])

        assert "estimated_poses" in preview
        assert "targets_pain" in preview
        assert "targets_improvement" in preview

    def test_targets_pain_true_when_pain_areas_given(self):
        """targets_pain should be True when pain areas provided."""
        preview = get_session_preview(["neck"], [])
        assert preview["targets_pain"] is True

    def test_targets_pain_false_when_no_pain_areas(self):
        """targets_pain should be False when no pain areas."""
        preview = get_session_preview([], ["balance"])
        assert preview["targets_pain"] is False

    def test_targets_improvement_true_when_improvement_areas_given(self):
        """targets_improvement should be True when improvement areas provided."""
        preview = get_session_preview([], ["balance"])
        assert preview["targets_improvement"] is True

    def test_targets_improvement_false_when_no_improvement_areas(self):
        """targets_improvement should be False when no improvement areas."""
        preview = get_session_preview(["neck"], [])
        assert preview["targets_improvement"] is False

    def test_minimum_poses_is_five(self):
        """Estimated poses should be at least 5."""
        preview = get_session_preview([], [])
        assert preview["estimated_poses"] >= 5

    def test_more_body_parts_more_poses(self):
        """More body parts should result in more estimated poses."""
        few_preview = get_session_preview(["neck"], [])
        many_preview = get_session_preview(["neck", "shoulders", "hips", "core"], [])

        # More body parts should generally mean more poses
        # (may be equal if overlapping poses)
        assert many_preview["estimated_poses"] >= few_preview["estimated_poses"]
