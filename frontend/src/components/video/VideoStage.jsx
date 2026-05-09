import { Radio, SignalHigh } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import VideoTile from "./VideoTile.jsx";
import MediaControls from "./MediaControls.jsx";
import { useAppStore } from "../../store/appStore.js";

export default function VideoStage() {
  const localStream = useAppStore((state) => state.localStream);
  const remoteStream = useAppStore((state) => state.remoteStream);
  const rtcConnectionState = useAppStore((state) => state.rtcConnectionState);
  const iceConnectionState = useAppStore((state) => state.iceConnectionState);

  const isConnected = rtcConnectionState === "connected" || iceConnectionState === "connected";

  return (
    <section className="media-panel flex min-h-0 flex-1 flex-col gap-3 rounded-lg p-3 text-white sm:p-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-sm font-semibold text-teal-200">Private room</p>
          <h2 className="mt-1 text-2xl font-bold">Video conversation</h2>
        </div>
        <Badge variant="dark">
          {isConnected ? <SignalHigh className="h-3.5 w-3.5 text-teal-300" /> : <Radio className="h-3.5 w-3.5 text-indigo-300" />}
          WebRTC {rtcConnectionState}
        </Badge>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.68fr)]">
        <VideoTile stream={remoteStream} label="Stranger" className="min-h-0" />
        <VideoTile stream={localStream} label="You" muted local className="min-h-0" />
      </div>

      <MediaControls />
    </section>
  );
}
