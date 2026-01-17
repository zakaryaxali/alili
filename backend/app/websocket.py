import os
import socketio
import time
import asyncio
from dotenv import load_dotenv
from .pose_detection import PoseDetector, decode_base64_image
from .pose_recognition import YogaPoseRecognizer
from .pose_analysis import PoseQualityAnalyzer
from .services.gemini_analyzer import GeminiPoseAnalyzer

# Load environment variables
load_dotenv()

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=False
)

# Initialize pose detection components
pose_detector = PoseDetector(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
pose_recognizer = YogaPoseRecognizer()
pose_analyzer = PoseQualityAnalyzer()

# Initialize Gemini analyzer if API key is available
gemini_api_key = os.getenv('GEMINI_API_KEY')
gemini_analyzer = GeminiPoseAnalyzer(gemini_api_key) if gemini_api_key else None

# Gemini feedback cache per client (sid -> cached data)
gemini_cache: dict[str, dict] = {}
GEMINI_CALL_INTERVAL = 3.0  # seconds between Gemini calls


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit('connect_response', {'status': 'connected'}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    # Clean up Gemini cache for this client
    if sid in gemini_cache:
        del gemini_cache[sid]


@sio.event
async def video_frame(sid, data):
    """
    Handle incoming video frames from client.

    Args:
        sid: Socket ID
        data: Dictionary with 'image' key containing base64 encoded frame
              and optional 'target_pose' for evaluation mode
    """
    try:
        # Decode the image
        image_base64 = data.get('image')
        if not image_base64:
            await sio.emit('error', {'message': 'No image data provided'}, room=sid)
            return

        # Get optional target pose for evaluation mode
        target_pose = data.get('target_pose')

        # Decode base64 to image
        image = decode_base64_image(image_base64)

        if image is None:
            await sio.emit('error', {'message': 'Failed to decode image'}, room=sid)
            return

        # Detect pose
        pose_result = pose_detector.detect(image)

        if not pose_result or not pose_result['landmarks']:
            # No pose detected
            await sio.emit('pose_result', {
                'landmarks': [],
                'poseName': target_pose if target_pose else 'No Pose Detected',
                'confidence': 0.0,
                'feedback': ['No person detected in frame'],
                'timestamp': int(time.time() * 1000)
            }, room=sid)
            return

        # Choose between evaluation mode or recognition mode
        angle_breakdown = {}
        if target_pose:
            # Evaluation mode: evaluate against target pose
            confidence, angle_breakdown = pose_recognizer.evaluate_target_pose(
                pose_result['landmarks'],
                target_pose
            )
            pose_name = target_pose

            # Analyze pose quality for the target pose
            feedback = []
            if confidence > 0.0:
                feedback = pose_analyzer.analyze(target_pose, pose_result['landmarks'])
            else:
                feedback = ["Unable to detect pose. Please ensure you're visible in the camera and try the pose again."]
        else:
            # Recognition mode: detect what pose user is doing
            pose_name, confidence = pose_recognizer.recognize(pose_result['landmarks'])

            # Analyze pose quality
            feedback = []
            if pose_name != "Unknown":
                feedback = pose_analyzer.analyze(pose_name, pose_result['landmarks'])

        # Use Gemini for richer feedback (with caching)
        gemini_feedback = None
        if gemini_analyzer and target_pose and confidence > 0.0:
            gemini_feedback = await _get_gemini_feedback(
                sid, image_base64, target_pose, confidence, angle_breakdown
            )

        # Prefer Gemini feedback if available, fallback to rule-based
        final_feedback = gemini_feedback if gemini_feedback else feedback

        # Send results back to client
        result = {
            'landmarks': pose_result['landmarks'],
            'poseName': pose_name,
            'confidence': float(confidence),
            'feedback': final_feedback,
            'timestamp': int(time.time() * 1000)
        }

        await sio.emit('pose_result', result, room=sid)

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        await sio.emit('error', {'message': f'Error processing frame: {str(e)}'}, room=sid)


async def _get_gemini_feedback(
    sid: str,
    image_base64: str,
    target_pose: str,
    confidence: float,
    angle_breakdown: dict
) -> list[str] | None:
    """
    Get Gemini feedback with caching to reduce API calls.

    Calls Gemini every GEMINI_CALL_INTERVAL seconds, returns cached feedback otherwise.
    """
    current_time = time.time()

    # Initialize cache for this client if needed
    if sid not in gemini_cache:
        gemini_cache[sid] = {
            'last_call': 0,
            'feedback': None,
            'target_pose': None
        }

    cache = gemini_cache[sid]

    # Check if we should make a new Gemini call
    time_since_last = current_time - cache['last_call']
    pose_changed = cache['target_pose'] != target_pose

    if time_since_last >= GEMINI_CALL_INTERVAL or pose_changed:
        # Update last_call BEFORE making the API call to prevent retry storms
        cache['last_call'] = current_time
        cache['target_pose'] = target_pose

        # Make Gemini API call (non-blocking for the main loop)
        try:
            feedback = await gemini_analyzer.analyze_pose(
                image_base64, target_pose, confidence, angle_breakdown
            )

            if feedback:
                cache['feedback'] = feedback

        except Exception as e:
            print(f"Gemini call failed: {e}")
            # Keep using cached feedback on error

    return cache['feedback']
