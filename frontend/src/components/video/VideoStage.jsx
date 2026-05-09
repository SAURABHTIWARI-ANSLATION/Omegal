import { Radio } from "lucide-react";
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
    <section className="flex min-h-[34rem] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Private room</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Video conversation</h1>
        </div>
        <Badge variant={isConnected ? "success" : "info"}>
          <Radio className="h-3.5 w-3.5" />
          WebRTC {rtcConnectionState}
        </Badge>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
        <VideoTile stream={remoteStream} label="Stranger" className="min-h-[22rem] lg:min-h-[34rem]" />
        <VideoTile stream={localStream} label="You" muted local className="min-h-[18rem] lg:min-h-[34rem]" />
      </div>

      <MediaControls />
    </section>
  );
}