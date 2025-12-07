import socketio
import time
from .pose_detection import PoseDetector, decode_base64_image
from .pose_recognition import YogaPoseRecognizer
from .pose_analysis import PoseQualityAnalyzer

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


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit('connect_response', {'status': 'connected'}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")


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

        # Send results back to client
        result = {
            'landmarks': pose_result['landmarks'],
            'poseName': pose_name,
            'confidence': float(confidence),
            'feedback': feedback,
            'timestamp': int(time.time() * 1000)
        }

        await sio.emit('pose_result', result, room=sid)

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        await sio.emit('error', {'message': f'Error processing frame: {str(e)}'}, room=sid)
