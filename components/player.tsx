"use client";

import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

export default function Player() {
  const {
    samplePack,
    playNext,
    playPrevious,
    playingSampleUrl,
    stop,
    isPlaying,
  } = usePlayerStore((state) => state);
  if (!samplePack) return null;

  function handleClick() {
    if (isPlaying) {
      stop();
      return;
    }
    if (!playingSampleUrl) return;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-neutral-900 border-t border-neutral-800 z-10">
      <div className="max-w-6xl mx-auto h-full px-4">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-neutral-800 rounded">
              <Image
                src={samplePack.imgUrl}
                alt={samplePack.title}
                height={48}
                width={48}
                className="size-12"
              />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium max-w-32 text-ellipsis overflow-hidden h-4">
                {playingSampleUrl}
              </h4>
              <p className="text-xs text-neutral-400">
                @{samplePack.creator.userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              className="text-neutral-400 hover:text-neutral-50 transition"
              onClick={playPrevious}
            >
              <SkipBack size={20} />
            </button>
            <button
              className="text-neutral-400 w-8 h-8 flex items-center justify-center rounded-full hover:scale-105 transition hover:text-neutral-50"
              onClick={handleClick}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              className="text-neutral-400 hover:text-neutral-50 transition"
              onClick={playNext}
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={20} className="text-neutral-400" />
            <div className="w-24 h-1 bg-neutral-800 rounded-full">
              <div className="w-1/2 h-full bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
