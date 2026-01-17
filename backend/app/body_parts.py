"""Body part mappings and pose metadata for session generation"""

# Pose metadata with base durations (seconds) and difficulty levels
POSE_METADATA = {
    "Mountain Pose": {
        "base_duration": 60,
        "difficulty": "easy",
        "targets": ["posture", "alignment", "balance"],
    },
    "Warrior II Left": {
        "base_duration": 45,
        "difficulty": "medium",
        "targets": ["legs", "hips", "balance", "shoulders"],
    },
    "Warrior II Right": {
        "base_duration": 45,
        "difficulty": "medium",
        "targets": ["legs", "hips", "balance", "shoulders"],
    },
    "Tree Pose Left": {
        "base_duration": 45,
        "difficulty": "medium",
        "targets": ["balance", "legs", "hips", "focus"],
    },
    "Tree Pose Right": {
        "base_duration": 45,
        "difficulty": "medium",
        "targets": ["balance", "legs", "hips", "focus"],
    },
    "Downward Dog": {
        "base_duration": 45,
        "difficulty": "medium",
        "targets": ["back", "shoulders", "hamstrings", "core"],
    },
    "Plank": {
        "base_duration": 30,
        "difficulty": "hard",
        "targets": ["core", "shoulders", "back", "arms"],
    },
    "Supine Bound Angle": {
        "base_duration": 90,
        "difficulty": "easy",
        "targets": ["hips", "groin", "inner_thighs", "relaxation"],
    },
    "Hug the Knees": {
        "base_duration": 60,
        "difficulty": "easy",
        "targets": ["lower_back", "hips", "relaxation"],
    },
    "Easy Seat": {
        "base_duration": 90,
        "difficulty": "easy",
        "targets": ["hips", "posture", "meditation"],
    },
    "Seated Hands Behind Back Stretch": {
        "base_duration": 60,
        "difficulty": "easy",
        "targets": ["shoulders", "chest", "upper_back"],
    },
    "Gomukasana Legs Fold": {
        "base_duration": 75,
        "difficulty": "medium",
        "targets": ["hips", "flexibility"],
    },
    "Janu Sirsasana Twist Left": {
        "base_duration": 60,
        "difficulty": "medium",
        "targets": ["hamstrings", "spine", "hips"],
    },
    "Janu Sirsasana Twist Right": {
        "base_duration": 60,
        "difficulty": "medium",
        "targets": ["hamstrings", "spine", "hips"],
    },
    "Janu Sirsasana Revolved Left": {
        "base_duration": 60,
        "difficulty": "medium",
        "targets": ["hamstrings", "spine", "hips", "twist"],
    },
    "Janu Sirsasana Revolved Right": {
        "base_duration": 60,
        "difficulty": "medium",
        "targets": ["hamstrings", "spine", "hips", "twist"],
    },
    "Reverse Table Top": {
        "base_duration": 30,
        "difficulty": "hard",
        "targets": ["core", "shoulders", "chest", "wrists"],
    },
    "Supine Bent Knees": {
        "base_duration": 90,
        "difficulty": "easy",
        "targets": ["lower_back", "relaxation"],
    },
}

# Body part to pose mappings
BODY_PART_POSES = {
    "neck": ["Easy Seat", "Seated Hands Behind Back Stretch", "Mountain Pose"],
    "shoulders": ["Downward Dog", "Reverse Table Top", "Seated Hands Behind Back Stretch", "Plank"],
    "upper_back": ["Downward Dog", "Seated Hands Behind Back Stretch", "Reverse Table Top"],
    "lower_back": ["Hug the Knees", "Supine Bent Knees", "Downward Dog", "Easy Seat"],
    "hips": [
        "Supine Bound Angle",
        "Gomukasana Legs Fold",
        "Warrior II Left",
        "Warrior II Right",
        "Tree Pose Left",
        "Tree Pose Right",
        "Janu Sirsasana Twist Left",
        "Janu Sirsasana Twist Right",
        "Easy Seat",
    ],
    "knees": ["Easy Seat", "Supine Bent Knees"],
    "hamstrings": ["Downward Dog", "Janu Sirsasana Twist Left", "Janu Sirsasana Twist Right"],
    "core": ["Plank", "Reverse Table Top", "Downward Dog"],
    "balance": ["Tree Pose Left", "Tree Pose Right", "Warrior II Left", "Warrior II Right"],
    "flexibility": [
        "Downward Dog",
        "Gomukasana Legs Fold",
        "Janu Sirsasana Revolved Left",
        "Janu Sirsasana Revolved Right",
        "Supine Bound Angle",
    ],
    "stress_relief": ["Easy Seat", "Supine Bound Angle", "Supine Bent Knees", "Hug the Knees"],
    "posture": ["Mountain Pose", "Easy Seat", "Downward Dog"],
}

# Asymmetrical pose pairs (must be practiced on both sides)
ASYMMETRIC_POSE_PAIRS = [
    ("Warrior II Left", "Warrior II Right"),
    ("Tree Pose Left", "Tree Pose Right"),
    ("Janu Sirsasana Twist Left", "Janu Sirsasana Twist Right"),
    ("Janu Sirsasana Revolved Left", "Janu Sirsasana Revolved Right"),
]

# Pose flow categories for sequencing
WARMUP_POSES = ["Mountain Pose", "Easy Seat", "Seated Hands Behind Back Stretch"]
PEAK_POSES = ["Warrior II Left", "Warrior II Right", "Plank", "Reverse Table Top", "Downward Dog"]
COOLDOWN_POSES = ["Supine Bound Angle", "Hug the Knees", "Supine Bent Knees", "Easy Seat"]


def get_poses_for_body_parts(body_parts: list[str]) -> list[str]:
    """Get all poses that target the specified body parts"""
    poses = set()
    for body_part in body_parts:
        if body_part in BODY_PART_POSES:
            poses.update(BODY_PART_POSES[body_part])
    return list(poses)


def is_asymmetric_pose(pose_name: str) -> bool:
    """Check if a pose is asymmetrical and requires a pair"""
    return any(pose_name in (left, right) for left, right in ASYMMETRIC_POSE_PAIRS)


def get_pose_pair(pose_name: str) -> str:
    """Get the paired pose for an asymmetrical pose"""
    for left, right in ASYMMETRIC_POSE_PAIRS:
        if pose_name == left:
            return right
        if pose_name == right:
            return left
    return None
