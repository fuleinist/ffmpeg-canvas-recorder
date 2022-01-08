import { useEffect } from "react";
import { Stage, Layer } from "react-konva";

import { useMyVideo, TransactionType } from "./comps/video";
import { useVideoRecorder } from "./comps/record";

declare global {
  interface Window {
    canvasPlayerConfig?: { url: string, srcs: string[] };
    videoUploadUrl?: string
  }
}

const App = () => {
  const { myVideo, setTransaction, loaded, switching, ended } = useMyVideo({
    loop: false
  });

  const {
    startRecord,
    recording,
    recorder,
    downloadReady
  } = useVideoRecorder();

  useEffect(() => {
    if (loaded && !ended && !recording) {
      startRecord();
    }
    if (ended && recording) {
      recorder?.stop();
    }
  }, [loaded, ended, recorder]);

  useEffect(() => {
    const event = new CustomEvent('pageLoaded', { detail: { date: Date.now() } });
    document.dispatchEvent(event);
  }, []);

  if(!myVideo) return null;

  return (
    <div>
      <Stage
        className="canvas-container"
        width={1920}
        height={1080}
      >
        <Layer>{myVideo}</Layer>
      </Stage>
      <select
        style={{ position: "absolute", top: 0 }}
        name="transactions"
        id="transactions"
        onChange={(e) => e.target.value && setTransaction!(e.target.value as TransactionType)}
      >
        <option value="fade">Fade</option>
        <option value="drop">Drop</option>
        <option value="swipe">Swipe</option>
      </select>
      <a
        id="download"
        href=""
        download="download.mp4"
        style={{ display: !downloadReady ? "none" : 'block' }}
      >
        Download
      </a>
      <div style={{ display: "none" }}>
        <video id="myVideo" controls></video>
        <video id="output-video" controls></video>
      </div>
    </div>
  );
};

export default App;