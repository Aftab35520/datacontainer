import React, { useRef, useState } from "react";

export default function ScreenAndCameraRecorder() {
  const screenVideoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const startCapture = async () => {
    try {
      // --- 1️⃣ SCREEN CAPTURE WITH AUDIO ---
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
        },
      });

      // --- 2️⃣ CAMERA CAPTURE WITH AUDIO ---
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });

      // --- 3️⃣ PLAY BOTH PREVIEWS ---
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play();
      }
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = cameraStream;
        cameraVideoRef.current.play();
      }

      setRecording(true);

      // --- 4️⃣ RECORDING FUNCTION ---
      const startRecordingCycle = (stream, label) => {
        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm; codecs=vp8,opus",
        });
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const timestamp = new Date().toISOString();
          downloadData(blob, `${label}_${timestamp}.webm`);
        };

        recorder.start();

        // Stop after 1 minute, then restart automatically
        setTimeout(() => {
          recorder.stop();
          startRecordingCycle(stream, label);
        }, 60 * 1000);
      };

      // --- 5️⃣ START RECORDING BOTH STREAMS ---
      startRecordingCycle(screenStream, "screen");
      startRecordingCycle(cameraStream, "camera");

      // --- 6️⃣ LOCATION CAPTURE EVERY 1 MIN ---
      if (navigator.geolocation) {
        const captureLocation = () => {
          navigator.geolocation.getCurrentPosition((pos) => {
            const timestamp = new Date().toISOString();
            const locationData = {
              timestamp,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            downloadData(
              JSON.stringify(locationData, null, 2),
              `location_${timestamp}.json`
            );
          });
        };
        captureLocation();
        setInterval(captureLocation, 60 * 1000);
      }
    } catch (err) {
      console.error("Capture failed:", err);
      alert("Failed to start capture. Check screen/camera permissions.");
    }
  };

  // --- 7️⃣ DOWNLOAD HELPER ---
  const downloadData = (data, filename) => {
    const blob =
      data instanceof Blob
        ? data
        : new Blob([data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>Auto 1-Min Screen + Camera Recorder (with Audio + Location)</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <div>
          <h4>Screen Preview</h4>
          <video
            ref={screenVideoRef}
            autoPlay
            muted
            style={{
              width: "400px",
              border: "1px solid black",
              borderRadius: "10px",
            }}
          ></video>
        </div>
        <div>
          <h4>Camera Preview</h4>
          <video
            ref={cameraVideoRef}
            autoPlay
            muted
            style={{
              width: "300px",
              border: "1px solid black",
              borderRadius: "10px",
            }}
          ></video>
        </div>
      </div>

      {!recording && (
        <div style={{ marginTop: 20 }}>
          <button onClick={startCapture}>Start Capture</button>
        </div>
      )}
    </div>
  );
}
