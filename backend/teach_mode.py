"""
Teach Mode - Record and replay browser automation sequences
Similar to Rabbit R1 teach mode
"""

import os
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Page

logger = logging.getLogger(__name__)

TEACH_MODE_STORAGE = "/app/backend/teach_sequences.json"

class TeachModeRecorder:
    """Records user actions during teach mode"""
    
    def __init__(self):
        self.recording = False
        self.actions: List[Dict] = []
        self.current_sequence_name = ""
        
    def start_recording(self, sequence_name: str):
        """Start recording a new sequence"""
        self.recording = True
        self.actions = []
        self.current_sequence_name = sequence_name
        logger.info(f"📹 Started recording sequence: {sequence_name}")
        
    def record_action(self, action_type: str, data: Dict):
        """Record a single action"""
        if not self.recording:
            return
            
        action = {
            "type": action_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        self.actions.append(action)
        logger.info(f"📝 Recorded: {action_type} - {data}")
        
    def stop_recording(self) -> Dict:
        """Stop recording and save sequence"""
        if not self.recording:
            return {"success": False, "error": "Not recording"}
            
        sequence = {
            "name": self.current_sequence_name,
            "actions": self.actions,
            "created_at": datetime.now().isoformat(),
            "action_count": len(self.actions)
        }
        
        # Save to storage
        self._save_sequence(sequence)
        
        self.recording = False
        self.actions = []
        
        logger.info(f"✅ Saved sequence '{self.current_sequence_name}' with {len(self.actions)} actions")
        
        return {
            "success": True,
            "sequence_name": self.current_sequence_name,
            "action_count": len(self.actions)
        }
    
    def _save_sequence(self, sequence: Dict):
        """Save sequence to persistent storage"""
        # Load existing sequences
        sequences = []
        if os.path.exists(TEACH_MODE_STORAGE):
            with open(TEACH_MODE_STORAGE, 'r') as f:
                sequences = json.load(f)
        
        # Add new sequence
        sequences.append(sequence)
        
        # Save back
        with open(TEACH_MODE_STORAGE, 'w') as f:
            json.dump(sequences, f, indent=2)


class TeachModePlayer:
    """Replays recorded sequences"""
    
    @staticmethod
    def get_all_sequences() -> List[Dict]:
        """Get all saved sequences"""
        if not os.path.exists(TEACH_MODE_STORAGE):
            return []
            
        with open(TEACH_MODE_STORAGE, 'r') as f:
            return json.load(f)
    
    @staticmethod
    def get_sequence(sequence_name: str) -> Optional[Dict]:
        """Get a specific sequence by name"""
        sequences = TeachModePlayer.get_all_sequences()
        for seq in sequences:
            if seq["name"] == sequence_name:
                return seq
        return None
    
    @staticmethod
    async def replay_sequence(
        sequence_name: str,
        variables: Dict = None
    ) -> Dict:
        """
        Replay a recorded sequence with optional variable substitution
        
        Args:
            sequence_name: Name of sequence to replay
            variables: Dict of variables to substitute (e.g., {"script": "new text", "avatar_id": "123"})
        """
        sequence = TeachModePlayer.get_sequence(sequence_name)
        if not sequence:
            return {"success": False, "error": f"Sequence '{sequence_name}' not found"}
        
        logger.info(f"▶️ Replaying sequence: {sequence_name}")
        
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        result = {"success": True, "video_id": None}
        
        try:
            for idx, action in enumerate(sequence["actions"]):
                action_type = action["type"]
                data = action["data"]
                
                # Apply variable substitution
                if variables:
                    data = TeachModePlayer._substitute_variables(data, variables)
                
                logger.info(f"Executing step {idx + 1}/{len(sequence['actions'])}: {action_type}")
                
                # Execute action based on type
                if action_type == "navigate":
                    await page.goto(data["url"], timeout=30000)
                    
                elif action_type == "click":
                    await page.click(data["selector"], timeout=10000)
                    
                elif action_type == "fill":
                    await page.fill(data["selector"], data["value"], timeout=10000)
                    
                elif action_type == "select":
                    await page.select_option(data["selector"], data["value"], timeout=10000)
                    
                elif action_type == "wait":
                    await page.wait_for_timeout(data["duration"])
                    
                elif action_type == "wait_for_selector":
                    await page.wait_for_selector(data["selector"], timeout=data.get("timeout", 10000))
                    
                elif action_type == "extract_video_id":
                    # Extract video ID from page
                    video_id = await page.evaluate(data["script"])
                    result["video_id"] = video_id
                    logger.info(f"✅ Extracted video ID: {video_id}")
                    
                elif action_type == "screenshot":
                    await page.screenshot(path=data["path"])
                    logger.info(f"📸 Screenshot saved: {data['path']}")
            
            logger.info(f"✅ Sequence '{sequence_name}' completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Error replaying sequence: {e}")
            result = {"success": False, "error": str(e)}
        
        finally:
            await browser.close()
            await playwright.stop()
        
        return result
    
    @staticmethod
    def _substitute_variables(data: Dict, variables: Dict) -> Dict:
        """Substitute variables in action data"""
        import copy
        data_copy = copy.deepcopy(data)
        
        for key, value in data_copy.items():
            if isinstance(value, str):
                # Replace {{variable_name}} with actual value
                for var_name, var_value in variables.items():
                    placeholder = f"{{{{{var_name}}}}}"
                    if placeholder in value:
                        data_copy[key] = value.replace(placeholder, str(var_value))
        
        return data_copy


# Global recorder instance
_recorder = TeachModeRecorder()

def get_recorder() -> TeachModeRecorder:
    """Get the global recorder instance"""
    return _recorder
