// frontend/src/components/VoiceWidget.jsx
import React, { useState, useRef } from "react";

/**
 * VoiceWidget.jsx
 * - Put this at frontend/src/components/VoiceWidget.jsx (replace existing)
 * - Ensure UPLOAD_URL matches your backend STT endpoint (port + path)
 */

const UPLOAD_URL = "http://localhost:8000/voice/stt"; // <-- update if needed

export default function VoiceWidget() {
  const [isRecording, setIsRecording] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Upload function is defined inside the component so it can use setMessage
  async function uploadAudioAndGetTranscript(blob) {
    setMessage("Uploading audio...");
    const fd = new FormData();
    fd.append("file", blob, "recording.webm");

    try {
      // short timeout helper
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s

      const resp = await fetch(UPLOAD_URL, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Upload failed ${resp.status}: ${txt}`);
      }

      const json = await resp.json().catch(() => null);
      console.log("STT response:", json);

      // check common fields
      const transcript = json?.transcript ?? json?.text ?? json?.result ?? null;
      if (transcript) {
        setMessage(`Transcript: ${transcript}`);
        return transcript;
      } else {
        setMessage("Upload complete. No transcript field returned.");
        return null;
      }
    } catch (err) {
      console.error("uploadAudioAndGetTranscript error:", err);
      if (err.name === "AbortError") {
        setMessage("Upload timed out.");
      } else {
        setMessage("Upload failed: " + (err.message || err));
      }
      throw err;
    }
  }

  const startRecording = async () => {
    setMessage("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage("getUserMedia not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      setChunks([]);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setChunks((prev) => [...prev, e.data]);
        }
      };

      mr.onstart = () => {
        setIsRecording(true);
        startTimer();
        setMessage("Recording...");
        console.log("Recording started");
      };

      mr.onstop = async () => {
        setIsRecording(false);
        stopTimer();
        console.log("Recording stopped");

        // Build blob from collected chunks
        const blob = new Blob(chunks, { type: "audio/webm" });

        // revoke previous url if any
        if (audioUrl) {
          try {
            URL.revokeObjectURL(audioUrl);
          } catch (e) {}
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Attempt to upload and get transcript
        try {
          await uploadAudioAndGetTranscript(blob);
        } catch (err) {
          // uploadAudioAndGetTranscript already sets message
        }

        // release microphone tracks
        try {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        } catch (e) {
          console.warn("Error stopping stream tracks", e);
        }
      };

      mr.onerror = (err) => {
        console.error("MediaRecorder error:", err);
        setMessage("Recording error. Check console.");
      };

      mr.start();
    } catch (err) {
      console.error("startRecording error:", err);
      setMessage("Could not start recording. Allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    } else {
      setMessage("No active recording to stop.");
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch (e) {}
    }
    setAudioUrl(null);
    setChunks([]);
    setMessage("");
  };

  return (
    <div style={{ padding: 12, borderRadius: 8, background: "#fafafa" }}>
      <h3 style={{ marginTop: 0 }}>Voice Chat</h3>

      <div style={{ marginBottom: 8 }}>
        <button onClick={startRecording} disabled={isRecording} style={{ marginRight: 8 }}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording} style={{ marginRight: 8 }}>
          Stop Recording
        </button>
        <button onClick={clearRecording} disabled={isRecording || !audioUrl}>
          Clear
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Status:</strong> {isRecording ? "Recording…" : "Idle"}
        {isRecording && <span> — {seconds}s</span>}
      </div>

      {audioUrl && (
        <div style={{ marginBottom: 8 }}>
          <audio controls src={audioUrl} />
          <div style={{ fontSize: 12, color: "#555" }}>Recorded audio (playback)</div>
        </div>
      )}

      <div style={{ marginTop: 8, color: message.startsWith("Upload") ? "green" : "black" }}>{message}</div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        <div>Debug tips:</div>
        <ul>
          <li>Allow microphone access when the browser prompts.</li>
          <li>Check console (F12) & Network tab for uploaded request to {UPLOAD_URL}</li>
          <li>If backend returns JSON with <code>transcript</code>, it will be shown in status.</li>
        </ul>
      </div>
    </div>
  );
}
