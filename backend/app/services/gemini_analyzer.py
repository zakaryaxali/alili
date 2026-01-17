import base64
import json
import re

from google import genai
from google.genai import types


class GeminiPoseAnalyzer:
    """Analyze yoga poses using Gemini 2.0 Flash vision capabilities."""

    def __init__(self, api_key: str):
        """Initialize the Gemini analyzer with API key."""
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash"

    async def analyze_pose(
        self, image_base64: str, target_pose: str, confidence: float, angle_breakdown: dict
    ) -> list[str]:
        """
        Analyze pose using Gemini Vision and return feedback.

        Args:
            image_base64: Base64 encoded JPEG image
            target_pose: Name of the target yoga pose
            confidence: Current match confidence (0.0 to 1.0)
            angle_breakdown: Dict with per-joint comparison details

        Returns:
            List of actionable feedback strings
        """
        # Format angle breakdown for the prompt
        angle_info = self._format_angle_breakdown(angle_breakdown)

        prompt = f"""You are an encouraging yoga instructor analyzing a student's {target_pose} pose.

Current match confidence: {confidence:.0%}
Joint analysis:
{angle_info}

Look at the image and provide 1-3 short, actionable corrections.
Be encouraging but specific. Focus on the most important fix first.
Keep each correction to one sentence.

Format: Return ONLY a JSON array of strings, e.g. ["Lift your arms higher", "Square your hips"]
Do not include any other text outside the JSON array."""

        try:
            # Create image part from base64 data
            image_part = types.Part.from_bytes(
                data=base64.b64decode(image_base64), mime_type="image/jpeg"
            )

            print(f"[GEMINI] Calling API for pose: {target_pose} (confidence: {confidence:.0%})")

            # Use async client for non-blocking API call
            response = await self.client.aio.models.generate_content(
                model=self.model, contents=[prompt, image_part]
            )

            feedback = self._parse_feedback(response.text)
            print(f"[GEMINI] Response: {feedback}")
            return feedback

        except Exception as e:
            print(f"[GEMINI] API error: {e}")
            return []

    def _format_angle_breakdown(self, angle_breakdown: dict) -> str:
        """Format the angle breakdown dictionary into a readable string."""
        if not angle_breakdown:
            return "No angle data available"

        lines = []
        for joint, data in angle_breakdown.items():
            joint_name = joint.replace("_", " ").title()
            status = data.get("status", "unknown")
            current = data.get("current", 0)
            target = data.get("target", 0)
            diff = data.get("difference", 0)

            status_emoji = (
                "✓" if status == "good" else "!" if status == "needs_improvement" else "✗"
            )
            lines.append(
                f"  {status_emoji} {joint_name}: {current:.0f}° (target: {target}°, off by {diff:.0f}°)"
            )

        return "\n".join(lines)

    def _parse_feedback(self, response_text: str) -> list[str]:
        """Parse JSON array response from Gemini."""
        try:
            # Try to extract JSON array from the response
            # Sometimes Gemini wraps it in markdown code blocks
            text = response_text.strip()

            # Remove markdown code block if present
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n?", "", text)
                text = re.sub(r"\n?```$", "", text)

            # Parse the JSON array
            feedback = json.loads(text)

            if isinstance(feedback, list):
                return [str(item) for item in feedback if item]

            return []

        except json.JSONDecodeError:
            print(f"Failed to parse Gemini response: {response_text}")
            return []
