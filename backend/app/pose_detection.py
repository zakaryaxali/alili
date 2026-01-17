import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class PoseDetector:
    """MediaPipe-based pose detection"""

    def __init__(self, min_detection_confidence: float = 0.5, min_tracking_confidence: float = 0.5):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def detect(self, image: np.ndarray) -> dict | None:
        """
        Detect pose landmarks in an image.

        Args:
            image: RGB image as numpy array

        Returns:
            Dictionary with landmarks or None if no pose detected
        """
        # Convert BGR to RGB if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image

        # Process the image
        results = self.pose.process(image_rgb)

        if not results.pose_landmarks:
            return None

        # Extract landmarks
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            landmarks.append(
                {
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility,
                }
            )

        return {"landmarks": landmarks, "world_landmarks": self._extract_world_landmarks(results)}

    def _extract_world_landmarks(self, results) -> list[dict] | None:
        """Extract world landmarks (3D coordinates in meters)"""
        if not results.pose_world_landmarks:
            return None

        world_landmarks = []
        for landmark in results.pose_world_landmarks.landmark:
            world_landmarks.append(
                {
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility,
                }
            )

        return world_landmarks

    def close(self):
        """Release resources"""
        self.pose.close()


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 string to numpy array image.

    Args:
        base64_string: Base64 encoded image string

    Returns:
        Numpy array image in BGR format
    """
    import base64

    # Decode base64
    img_data = base64.b64decode(base64_string)

    # Convert to numpy array
    nparr = np.frombuffer(img_data, np.uint8)

    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return img
