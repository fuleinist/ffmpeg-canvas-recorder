import { useState, useRef } from "react";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

import { uploadToS3 } from "../utils/uploadToS3"

//https://stackoverflow.com/a/62865574/7080032
const ffmpeg = createFFmpeg({corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js", log: true});

export const useVideoRecorder = () => {
  const [downloadReady, setDownloadReady] = useState(false);
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder>();

  const transcode = async (webcamData: Uint8Array) => {
    const dl = document.getElementById("download") as HTMLLinkElement;
    console.log("Start transcoding", webcamData.length);
    ffmpeg.FS(
      "writeFile",
      "output.mp4",
      webcamData
    );
    console.log("Complete transcoding");
    const data = ffmpeg.FS("readFile", "output.mp4");
    console.log('videoData', data.length)

    const video = document.getElementById("output-video") as HTMLVideoElement;
    const blob = new Blob([data.buffer], { type: "video/mp4" })
    console.log('videoBlob', blob.size)

    video.src = URL.createObjectURL(blob);
    dl.href = video.src;
    const file = new File([blob], `upload.mp4`, { type: 'video/mp4' });
    console.log('videoFile', [file.name, file.type, file.size])

    return {
      src: video.src,
      file
    };
  };

  function record(canvas: HTMLCanvasElement, myVideo: HTMLVideoElement) {
    const recordedChunks: BlobPart[] | undefined = [];
    const stream = canvas.captureStream(60);
    let time = 0;
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
      videoBitsPerSecond: 10 * 1024 * 1024, /* 10mbps */
    });
    mediaRecorderRef.current = mediaRecorder;
    return new Promise(function (res, rej) {
      mediaRecorder.start(time);
      mediaRecorder.ondataavailable = function (e) {
        recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = function (event) {
        try {
          const blob = new Blob(recordedChunks, {
            type: "video/webm"
          });
          const url = URL.createObjectURL(blob);
          res({ url, blob }); // resolve both blob and url in an object

          myVideo.src = url;
          // // removed data url conversion for brevity
        } catch (e) {
          console.error(e);
          rej(e);
        }
      };
    }) as Promise<{ url: string, blob: Blob }>;
  }

  const startRecord = async () => {
    const canvas = document
    .getElementsByClassName("konvajs-content")[0]
    .getElementsByTagName("canvas")[0];
    if (!canvas) {
      console.log('no canvas found')
      return;
    }
    downloadReady && setDownloadReady(false);
    if(!recording && !ffmpeg.isLoaded()) { await ffmpeg.load(); }
    setRecording(true);
    record(canvas, document.getElementById("myVideo") as HTMLVideoElement).then(
      async ({ url, blob }) => {
        const result = await transcode(new Uint8Array(await blob.arrayBuffer()));
        const event = new CustomEvent('videoRecordComplete', { detail: result.file.size });
        document.dispatchEvent(event);
        setDownloadReady(true);
        setRecording(false);
        // Handle upload to S3 and then emit event to update chrominum
        const uploadUrl = window.videoUploadUrl
        if(uploadUrl) {
          console.log('start uploading', JSON.stringify([result.file.type, result.file.name, result.file.size]));
          uploadToS3(result.file, uploadUrl).then((res) => {
            const event = new CustomEvent('videoUploaded', { detail: res?.status });
            document.dispatchEvent(event);
          });
        } else {
          console.error('no videoUploadUrl from chrominum');
        }
      });
    };
  return {
    startRecord,
    recording,
    recorder: mediaRecorderRef.current,
    downloadReady
  };
};
