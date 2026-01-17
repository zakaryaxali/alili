"""Session generation with smart duration scaling"""

import uuid

from .body_parts import (
    COOLDOWN_POSES,
    POSE_METADATA,
    WARMUP_POSES,
    get_pose_pair,
    get_poses_for_body_parts,
    is_asymmetric_pose,
)


def generate_session(
    pain_areas: list[str], improvement_areas: list[str], duration_minutes: int
) -> dict:
    """
    Generate a personalized yoga session

    Args:
        pain_areas: Body parts experiencing pain
        improvement_areas: Body parts to improve/strengthen
        duration_minutes: Total session duration in minutes

    Returns:
        Session dictionary with poses and durations
    """
    # 1. Select poses based on body parts
    pain_poses = get_poses_for_body_parts(pain_areas)
    improvement_poses = get_poses_for_body_parts(improvement_areas)

    # Combine and deduplicate
    selected_poses = []
    pose_tags = {}  # Track if pose targets pain or improvement

    for pose in pain_poses:
        if pose not in selected_poses:
            selected_poses.append(pose)
            pose_tags[pose] = "pain"

    for pose in improvement_poses:
        if pose not in selected_poses:
            selected_poses.append(pose)
            pose_tags[pose] = "improvement"

    # If no poses selected, use a balanced default sequence
    if not selected_poses:
        selected_poses = [
            "Mountain Pose",
            "Downward Dog",
            "Warrior II Left",
            "Warrior II Right",
            "Tree Pose Left",
            "Tree Pose Right",
            "Easy Seat",
            "Supine Bent Knees",
        ]
        pose_tags = dict.fromkeys(selected_poses, "general")

    # 2. Auto-pair asymmetrical poses
    final_poses = []
    added_poses = set()

    for pose in selected_poses:
        if pose in added_poses:
            continue

        if is_asymmetric_pose(pose):
            pair = get_pose_pair(pose)
            if pair:
                final_poses.append(pose)
                final_poses.append(pair)
                added_poses.add(pose)
                added_poses.add(pair)
                # Copy tag to paired pose
                if pair not in pose_tags:
                    pose_tags[pair] = pose_tags[pose]
        else:
            final_poses.append(pose)
            added_poses.add(pose)

    # 3. Order poses: warmup → peak → cooldown
    ordered_poses = _order_poses(final_poses)

    # 4. Calculate initial durations
    pose_durations = []
    total_base_duration = 0

    for pose in ordered_poses:
        base_duration = POSE_METADATA[pose]["base_duration"]

        # Add pain bonus (+30 seconds)
        is_pain_target = pose_tags.get(pose) == "pain"
        duration = base_duration + 30 if is_pain_target else base_duration

        pose_durations.append(
            {
                "name": pose,
                "duration": duration,
                "is_pain_target": is_pain_target,
                "is_improvement_target": pose_tags.get(pose) == "improvement",
            }
        )
        total_base_duration += duration

    # 5. Scale durations to fit session time
    target_duration = duration_minutes * 60  # Convert to seconds
    transition_time = (len(pose_durations) - 1) * 5  # 5 seconds between poses
    available_time = target_duration - transition_time

    if total_base_duration != available_time:
        scale_factor = available_time / total_base_duration

        for pose_data in pose_durations:
            pose_data["duration"] = int(pose_data["duration"] * scale_factor)

    # 6. Create session object
    session = {
        "id": str(uuid.uuid4()),
        "poses": [
            {
                "pose_name": p["name"],
                "duration": p["duration"],
                "order": idx + 1,
                "is_pain_target": p["is_pain_target"],
                "is_improvement_target": p["is_improvement_target"],
            }
            for idx, p in enumerate(pose_durations)
        ],
        "total_duration": duration_minutes,
        "num_poses": len(pose_durations),
        "pain_areas": pain_areas,
        "improvement_areas": improvement_areas,
    }

    return session


def _order_poses(poses: list[str]) -> list[str]:
    """Order poses in a logical flow: warmup → peak → cooldown"""
    warmup = []
    peak = []
    cooldown = []

    for pose in poses:
        if pose in WARMUP_POSES:
            warmup.append(pose)
        elif pose in COOLDOWN_POSES:
            cooldown.append(pose)
        else:
            peak.append(pose)

    # Ensure at least one warmup and cooldown
    if not warmup and poses:
        if "Mountain Pose" in poses:
            warmup.append("Mountain Pose")
            peak = [p for p in peak if p != "Mountain Pose"]
        elif "Easy Seat" in poses:
            warmup.append("Easy Seat")
            peak = [p for p in peak if p != "Easy Seat"]

    if not cooldown and poses:
        if "Supine Bent Knees" in poses:
            cooldown.append("Supine Bent Knees")
            peak = [p for p in peak if p != "Supine Bent Knees"]
        elif "Easy Seat" in poses and "Easy Seat" not in warmup:
            cooldown.append("Easy Seat")
            peak = [p for p in peak if p != "Easy Seat"]

    return warmup + peak + cooldown


def get_session_preview(pain_areas: list[str], improvement_areas: list[str]) -> dict:
    """
    Get a preview of how many poses would be in a session

    Args:
        pain_areas: Body parts experiencing pain
        improvement_areas: Body parts to improve

    Returns:
        Preview with estimated pose count
    """
    pain_poses = get_poses_for_body_parts(pain_areas)
    improvement_poses = get_poses_for_body_parts(improvement_areas)

    # Combine and deduplicate
    all_poses = set(pain_poses + improvement_poses)

    # Account for asymmetric pairs
    estimated_poses = 0
    counted = set()

    for pose in all_poses:
        if pose in counted:
            continue

        if is_asymmetric_pose(pose):
            pair = get_pose_pair(pose)
            estimated_poses += 2
            counted.add(pose)
            if pair:
                counted.add(pair)
        else:
            estimated_poses += 1
            counted.add(pose)

    return {
        "estimated_poses": max(estimated_poses, 5),  # Minimum 5 poses
        "targets_pain": len(pain_poses) > 0,
        "targets_improvement": len(improvement_poses) > 0,
    }
