import { useEffect, useRef, useState } from "react";
import { Columns2, Maximize2, Minimize2, Radio, SignalHigh } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import VideoTile from "./VideoTile.jsx";
import MediaControls from "./MediaControls.jsx";
import { useAppStore } from "../../store/appStore.js";
import { cn } from "../../utils/helpers.js";

export default function VideoStage() {
  const stageRef = useRef(null);
  const [isCinemaLayout, setIsCinemaLayout] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localStream = useAppStore((state) => state.localStream);
  const remoteStream = useAppStore((state) => state.remoteStream);
  const rtcConnectionState = useAppStore((state) => state.rtcConnectionState);
  const iceConnectionState = useAppStore((state) => state.iceConnectionState);

  const isConnected = rtcConnectionState === "connected" || iceConnectionState === "connected";
  const isImmersive = isCinemaLayout || isFullscreen;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;

    try {
      if (document.fullscreenElement === stageRef.current) {
        await document.exitFullscreen();
      } else {
        await stageRef.current.requestFullscreen();
        setIsCinemaLayout(true);
      }
    } catch {
      setIsCinemaLayout(true);
    }
  };

  return (
    <section
      ref={stageRef}
      className={cn(
        "media-panel relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg p-3 text-white sm:p-4",
        isFullscreen && "h-screen w-screen rounded-none border-0 bg-slate-950 p-3 sm:p-5"
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-sm font-semibold text-teal-200">Private room</p>
          <h2 className="mt-1 text-2xl font-bold">Video conversation</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="dark">
            {isConnected ? <SignalHigh className="h-3.5 w-3.5 text-teal-300" /> : <Radio className="h-3.5 w-3.5 text-indigo-300" />}
            WebRTC {rtcConnectionState}
          </Badge>
          <Button type="button" variant="subtle" size="sm" onClick={() => setIsCinemaLayout((value) => !value)}>
            {isCinemaLayout ? <Columns2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isCinemaLayout ? "Split" : "Maximize"}
          </Button>
          <Button type="button" variant="subtle" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? "Exit full" : "Full screen"}
          </Button>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1", isImmersive ? "relative" : "grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.68fr)]")}>
        <VideoTile stream={remoteStream} label="Stranger" className={cn("min-h-0", isImmersive ? "absolute inset-0 h-full w-full" : "h-full")} />
        <VideoTile
          stream={localStream}
          label="You"
          muted
          local
          className={cn(
            "min-h-0",
            isImmersive
              ? "absolute bottom-3 right-3 z-20 h-28 w-40 border-teal-300/50 shadow-[0_20px_60px_rgba(0,0,0,0.42)] sm:h-36 sm:w-56 lg:h-44 lg:w-72"
              : "h-full"
          )}
        />
      </div>

      <MediaControls />
    </section>
  );
}
