import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeachMode() {
  const nav = useNavigate();
  
  const [recording, setRecording] = useState(false);
  const [sequences, setSequences] = useState([]);
  const [currentSequence, setCurrentSequence] = useState(null);
  const [actionCount, setActionCount] = useState(0);
  const [sequenceName, setSequenceName] = useState('');
  const [replayStatus, setReplayStatus] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');
  
  // Variables for replay
  const [replayVars, setReplayVars] = useState({
    avatar_id: '',
    script: '',
    voice_id: ''
  });
  
  // Check status on mount
  useEffect(() => {
    fetchStatus();
    fetchSequences();
  }, []);
  
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/teach-mode/status');
      const data = await response.json();
      setRecording(data.recording);
      setCurrentSequence(data.current_sequence);
      setActionCount(data.action_count);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };
  
  const fetchSequences = async () => {
    try {
      const response = await fetch('/api/teach-mode/sequences');
      const data = await response.json();
      if (data.success) {
        setSequences(data.sequences);
      }
    } catch (error) {
      console.error('Error fetching sequences:', error);
    }
  };
  
  const startRecording = async () => {
    if (!sequenceName.trim()) {
      alert('Please enter a sequence name');
      return;
    }
    
    try {
      const response = await fetch('/api/teach-mode/start-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence_name: sequenceName })
      });
      
      const data = await response.json();
      if (data.success) {
        setRecording(true);
        setCurrentSequence(sequenceName);
        setActionCount(0);
        alert(`Recording started: ${sequenceName}\n\nNow go to HeyGen and perform your video generation steps manually.\nEach action will be recorded.`);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording');
    }
  };
  
  const stopRecording = async () => {
    try {
      const response = await fetch('/api/teach-mode/stop-recording', {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setRecording(false);
        setCurrentSequence(null);
        setActionCount(0);
        setSequenceName('');
        fetchSequences();
        alert(`Recording saved!\n\nSequence: ${data.sequence_name}\nActions: ${data.action_count}`);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert('Failed to stop recording');
    }
  };
  
  const replaySequence = async () => {
    if (!selectedSequence) {
      alert('Please select a sequence to replay');
      return;
    }
    
    setReplayStatus('Replaying...');
    
    try {
      const response = await fetch('/api/teach-mode/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_name: selectedSequence,
          variables: replayVars
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setReplayStatus(`✅ Success! Video ID: ${data.video_id || 'N/A'}`);
        alert(`Replay completed!\nVideo ID: ${data.video_id || 'N/A'}`);
      } else {
        setReplayStatus(`❌ Failed: ${data.error}`);
        alert(`Replay failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error replaying:', error);
      setReplayStatus(`❌ Error: ${error.message}`);
      alert(`Replay error: ${error.message}`);
    }
  };
  
  return (
    <div style={{ padding: 20, minHeight: '100vh' }}>
      {/* Header */}
      <div className="tsv-glass tsv-glow" style={{ padding: 16, marginBottom: 20 }}>
        <button onClick={() => nav('/')} className="tsv-btn" style={{ marginBottom: 12 }}>
          ← BACK TO TERMINAL
        </button>
        <div className="tsv-title" style={{ fontSize: 24, marginBottom: 8 }}>
          🎓 TEACH MODE
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Record HeyGen workflows once, replay them automatically forever
        </div>
      </div>
      
      {/* Recording Section */}
      <div className="tsv-glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#ff69b4' }}>
          📹 RECORD NEW SEQUENCE
        </div>
        
        {!recording ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                Sequence Name:
              </label>
              <input
                type="text"
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="e.g., heygen_video_generation"
                className="tsv-input"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,105,180,0.3)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13
                }}
              />
            </div>
            
            <button onClick={startRecording} className="tsv-btn" style={{ width: '100%', marginTop: 12 }}>
              🔴 START RECORDING
            </button>
            
            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
              <strong>How it works:</strong>
              <br/>
              1. Enter a name for this workflow
              <br/>
              2. Click "Start Recording"
              <br/>
              3. Manually perform video generation on HeyGen website
              <br/>
              4. Come back and click "Stop Recording"
              <br/>
              5. The system saves all your actions for future replay
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              background: 'rgba(255,0,0,0.2)',
              border: '2px solid #ff0000',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                🔴 RECORDING: {currentSequence}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                Actions recorded: {actionCount}
              </div>
            </div>
            
            <button onClick={stopRecording} className="tsv-btn" style={{ width: '100%', background: 'rgba(255,0,0,0.3)' }}>
              ⏹️ STOP RECORDING
            </button>
            
            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.8, color: '#ffaa00' }}>
              ⚠️ Go to HeyGen now and perform your video generation steps. All actions are being recorded.
            </div>
          </div>
        )}
      </div>
      
      {/* Saved Sequences */}
      <div className="tsv-glass" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#ff69b4' }}>
          💾 SAVED SEQUENCES ({sequences.length})
        </div>
        
        {sequences.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.6, padding: 20, textAlign: 'center' }}>
            No sequences saved yet. Record your first workflow above!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sequences.map((seq, idx) => (
              <div
                key={idx}
                className="tsv-glass"
                style={{
                  padding: 12,
                  cursor: 'pointer',
                  border: selectedSequence === seq.name ? '2px solid #ff69b4' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8
                }}
                onClick={() => setSelectedSequence(seq.name)}
              >
                <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
                  {seq.name}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {seq.action_count} actions • Created: {new Date(seq.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Replay Section */}
      {selectedSequence && (
        <div className="tsv-glass" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#00ff00' }}>
            ▶️ REPLAY: {selectedSequence}
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.8 }}>
              Optional: Override variables for this replay
            </div>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Avatar ID:</label>
                <input
                  type="text"
                  value={replayVars.avatar_id}
                  onChange={(e) => setReplayVars({...replayVars, avatar_id: e.target.value})}
                  placeholder="Leave empty to use recorded value"
                  className="tsv-input"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,105,180,0.3)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Script Text:</label>
                <textarea
                  value={replayVars.script}
                  onChange={(e) => setReplayVars({...replayVars, script: e.target.value})}
                  placeholder="Leave empty to use recorded value"
                  className="tsv-input"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,105,180,0.3)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12,
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>Voice ID:</label>
                <input
                  type="text"
                  value={replayVars.voice_id}
                  onChange={(e) => setReplayVars({...replayVars, voice_id: e.target.value})}
                  placeholder="Leave empty to use recorded value"
                  className="tsv-input"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,105,180,0.3)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12
                  }}
                />
              </div>
            </div>
          </div>
          
          <button onClick={replaySequence} className="tsv-btn" style={{ width: '100%', background: 'rgba(0,255,0,0.2)' }}>
            ▶️ REPLAY SEQUENCE
          </button>
          
          {replayStatus && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: replayStatus.includes('✅') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
              border: `1px solid ${replayStatus.includes('✅') ? '#00ff00' : '#ff0000'}`,
              borderRadius: 6,
              fontSize: 13
            }}>
              {replayStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
