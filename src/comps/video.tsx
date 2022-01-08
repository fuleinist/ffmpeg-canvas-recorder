import { useEffect, useState, useRef } from "react";
import { Image as KonvaMedia } from "react-konva";

import Konva from "konva";

const mockSrcs = [
  "https://temp-ligr-assets.s3.amazonaws.com/1/mediaVideo/10/1639378974118.510X150_compressed.mp4/mp4/video_std.mp4",
  "https://temp-ligr-assets.s3.amazonaws.com/1/mediaVideo/1/1639541876462.yt5s.com_Pilot_TVC_June_2020_1080p.mp4/mp4/video_std.mp4"
];

// const mockSrcs = [
//   "/videos/video1.mp4",
//   "/videos/video2.mp4",
// ];

export type TransactionType = 'fade' | 'swipe' | 'drop'

const transValue = (type: TransactionType, { revert, isEven }: { revert?: boolean, isEven: boolean }) => {
  const r = revert ? !isEven : isEven;
  const trans = {
    fade: {
      opacity: r ? 1 : 0,
      duration: 1
    },
    swipe: {
      opacity: r ? 1 : 0,
      x: r ? 0 : -640,
      duration: 1   
    },
    drop: {
      opacity: r ? 1 : 0,
      y: r ? 0 : -360,
      duration: 1
    }
  };
  return trans[type];
};

export const VideoComp: React.FC<any> = ({forwardRef, videoEle, ...rest}) => {
  return (
    <KonvaMedia
      ref={forwardRef}
      image={videoEle}
      {...rest}
    />
  );
};

export const useVideoPlay = (srcs: string[], { loop }: { loop: boolean }) => {
  const [loaded, setLoaded] = useState(false);
  const [ended, setEnded] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [idx, setIdx] = useState(0);
  const vidEle1Ref = useRef<HTMLVideoElement>();
  const vidEle2Ref = useRef<HTMLVideoElement>();
  const isEven = idx % 2 === 0;
  const setupVideo = async (vidEle: HTMLVideoElement, src: string) => {
    vidEle.muted = true;
    vidEle.playsInline = true;
    const source = document.createElement('source');
    source.setAttribute('src', src);
    source.setAttribute('type', 'video/mp4');
    vidEle.appendChild(source);
    vidEle.load();
    vidEle.oncanplay = async function (e) {
      setLoaded(true);
    };
    vidEle.onended = function (e) {
      const id = Number(vidEle.id);
      if (!loop && id === srcs.length - 1) {
        setEnded(true);
        return;
      }
      setSwitching(true);
    };
  };

  useEffect(() => {
    //setup videoEles
    if(isEven) {
      if(!vidEle1Ref.current) {
        const vidEle1 = document.createElement("video") as HTMLVideoElement;
        vidEle1Ref.current = vidEle1;
        vidEle1.id = `${idx}`;
        setupVideo(vidEle1, srcs[idx]);
      }
      if(!vidEle2Ref.current) {
        const vidEle2 = document.createElement("video") as HTMLVideoElement;
        vidEle2Ref.current = vidEle2;
        vidEle2.id = `${idx+1}`;
        setupVideo(vidEle2, srcs[idx + 1]);
      }
      if(vidEle2Ref.current && srcs[idx + 1]) {
        //load the next video into vidEle2
        vidEle2Ref.current.getElementsByTagName('source')[0].setAttribute('src', srcs[idx + 1]);
        vidEle2Ref.current.load();
      }
      if(vidEle1Ref.current) {
        //play video 1
        vidEle1Ref.current.play();
      }
    } else if (!isEven) {
      if(vidEle2Ref.current) {
        vidEle2Ref.current.play();
      }
      if(vidEle1Ref.current && srcs[idx + 1]) {
        //load the next video into vidEle1
        vidEle1Ref.current.getElementsByTagName('source')[0].setAttribute('src', srcs[idx + 1]);
        vidEle1Ref.current.load();
      }
    }
  }, [idx])

  useEffect(() => {
    if (srcs[idx + 1] && switching) {
      const switchingTimeout = setTimeout(() => {
        switching && setSwitching(false);
        setIdx(idx + 1);
      }, 1000);
      return () => {
        clearTimeout(switchingTimeout);
      };
    }
  }, [srcs, switching]);

  return {
    vidEle1: vidEle1Ref.current,
    vidEle2: vidEle2Ref.current,
    loaded,
    ended,
    isEven,
    switching
  };
};

export const useMyVideo = ({ loop }: { loop: boolean }) => {
  const [srcs, setSrcs] = useState<string[] | undefined>(undefined);
  const configUrl = new URLSearchParams(window.location.search).get('configUrl');
  useEffect(() => {
    const loadConfig = async () => {
      if(!configUrl) {
        setSrcs(mockSrcs);
        return
      }
      const srcs = await (await fetch(configUrl)).json();
      setSrcs(srcs);
    }
    loadConfig();
  }, []);
  const transType: TransactionType[] = ["fade", "swipe", "drop"];
  const [animateStart, setAnimateStart] = useState(false);
  const [transaction, setTransaction] = useState(
    transType[Math.floor(Math.random() * transType.length)]
  );
  const media1Ref = useRef<Konva.Node>();
  const media2Ref = useRef<Konva.Node>();

  const { vidEle1, vidEle2, loaded, ended, isEven, switching } = useVideoPlay(
    srcs || mockSrcs,
    {
      loop
    }
  );

  useEffect(() => {
    media1Ref?.current?.to(transValue(transaction, { isEven,  revert: true }));
    media2Ref?.current?.to(transValue(transaction, { isEven }));
  }, [transaction, switching]);

  useEffect(() => {
    if (animateStart) return;
    let anim1: Konva.Animation | undefined = undefined;let anim2: Konva.Animation | undefined = undefined;
    if(media1Ref.current) {
      const layer1 = media1Ref.current.getLayer();
      anim1 = new Konva.Animation(() => {}, layer1);
    }
    if(media2Ref.current) {
      const layer2 = media2Ref.current.getLayer();
      anim2 = new Konva.Animation(() => {}, layer2);
    }
    anim1?.start();
    anim2?.start();
    if(anim1 || anim2) setAnimateStart(true);
    return () => { 
      anim1?.stop();
      anim2?.stop();
      if(animateStart) setAnimateStart(false); 
    }
  }, [media1Ref, media2Ref, loaded]);

  if(!srcs)  return {};

  return {
    myVideo: (
      <>
        {vidEle1 ? (
          <VideoComp
            forwardRef={media1Ref}
            videoEle={vidEle1}
            width={vidEle1.videoWidth}
            height={vidEle1.videoHeight}
          />
        ) : null}
        {vidEle2 ? (
          <VideoComp
            forwardRef={media2Ref}
            videoEle={vidEle2}
            width={vidEle2.videoWidth}
            height={vidEle2.videoHeight}
          />
        ) : null}
      </>
    ),
    setTransaction,
    loaded,
    switching,
    ended
  };
};
