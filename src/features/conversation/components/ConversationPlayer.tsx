import { Clapperboard, Maximize, Minimize, Pause, Play, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { VIDEO_CONFIG } from '@/config/app';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import {
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenSupported,
  onFullscreenChange,
} from '@/lib/fullscreen';
import type { Conversation } from '@/types/models';

interface ConversationPlayerProps {
  conversation: Conversation;
  /** Fired when a local video finishes. */
  onEnded?: () => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const FRAME = 'relative aspect-video w-full overflow-hidden rounded-2xl bg-navy-950 shadow-soft';

/**
 * Video area (spec §9.2; design screen 10). A local MP4/WebM plays with the design's control bar
 * (play, time, speed, HD, full screen); a YouTube id is supported but needs Internet
 * (privacy-enhanced embed). Never autoplays. Errors show a friendly message — the transcript
 * stays reachable from the page.
 */
export function ConversationPlayer({ conversation, onEnded, className }: ConversationPlayerProps) {
  const [failed, setFailed] = useState(false);

  if (conversation.videoSrc && !failed) {
    return (
      <LocalVideo
        conversation={conversation}
        onEnded={onEnded}
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  if (conversation.youtubeId && !failed) {
    return (
      <div className={cn(FRAME, className)}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(conversation.youtubeId)}?rel=0`}
          title={`Video: ${conversation.title}`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={cn(FRAME, className)}>
      <img
        src={assetUrl(conversation.poster)}
        alt=""
        className="h-full w-full object-cover opacity-70 blur-[2px]"
        draggable={false}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 pb-20 text-center text-white">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          {failed ? (
            <VideoOff aria-hidden className="size-8" />
          ) : (
            <Clapperboard aria-hidden className="size-8" />
          )}
        </span>
        <p className="text-2xl font-extrabold drop-shadow">
          {failed ? 'This video can’t play right now' : 'Video coming soon'}
        </p>
        <p className="max-w-md font-semibold text-white/90 drop-shadow">
          You can still read and listen to the conversation.
        </p>
      </div>
      <ControlBar disabled playing={false} time={0} duration={0} />
    </div>
  );
}

function LocalVideo({
  conversation,
  onEnded,
  onError,
  className,
}: {
  conversation: Conversation;
  onEnded?: () => void;
  onError: () => void;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<number>(VIDEO_CONFIG.playbackRates[0]);
  const [hd, setHd] = useState(false);
  const [fullscreenSupported] = useState(isFullscreenSupported);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreenSupported) return;
    return onFullscreenChange(() => setIsFullscreen(getFullscreenElement() === frameRef.current));
  }, [fullscreenSupported]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  const nextRate = () => {
    const rates = VIDEO_CONFIG.playbackRates;
    const next = rates[(rates.indexOf(rate as (typeof rates)[number]) + 1) % rates.length];
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  return (
    <div ref={frameRef} className={cn(FRAME, className)}>
      {/* Captions are added as soon as the content provides `captionsSrc` (.vtt). */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <video
        ref={videoRef}
        className="h-full w-full bg-navy-950 object-contain"
        src={assetUrl(conversation.videoSrc!)}
        poster={assetUrl(conversation.poster)}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          setHd(event.currentTarget.videoHeight >= VIDEO_CONFIG.hdMinHeight);
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onError={onError}
      >
        {conversation.captionsSrc && (
          <track
            kind="captions"
            src={assetUrl(conversation.captionsSrc)}
            srcLang="en"
            label="English"
            default
          />
        )}
      </video>
      <ControlBar
        playing={playing}
        time={time}
        duration={duration}
        rate={rate}
        hd={hd}
        onTogglePlay={togglePlay}
        onSeek={(seconds) => {
          if (videoRef.current) videoRef.current.currentTime = seconds;
          setTime(seconds);
        }}
        onRate={nextRate}
        fullscreen={
          fullscreenSupported
            ? {
                active: isFullscreen,
                toggle: () => {
                  if (isFullscreen) void exitFullscreen();
                  else if (frameRef.current) void enterFullscreen(frameRef.current);
                },
              }
            : undefined
        }
      />
    </div>
  );
}

function ControlBar({
  playing,
  time,
  duration,
  rate = VIDEO_CONFIG.playbackRates[0],
  hd = false,
  disabled = false,
  onTogglePlay,
  onSeek,
  onRate,
  fullscreen,
}: {
  playing: boolean;
  time: number;
  duration: number;
  rate?: number;
  hd?: boolean;
  disabled?: boolean;
  onTogglePlay?: () => void;
  onSeek?: (seconds: number) => void;
  onRate?: () => void;
  fullscreen?: { active: boolean; toggle: () => void };
}) {
  const percent = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  const button =
    'flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60 disabled:hover:bg-transparent';

  return (
    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-950/85 to-navy-950/55 px-3 pt-2 pb-1.5 backdrop-blur-sm sm:px-4">
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(time, duration || 0)}
        disabled={disabled || duration === 0}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        className="block h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-[#3fb6ff] disabled:cursor-default [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
        style={{
          background: `linear-gradient(to right, #3fb6ff ${percent}%, rgb(255 255 255 / 0.3) ${percent}%)`,
        }}
      />
      <div className="mt-1 flex items-center gap-1 text-white">
        <button
          type="button"
          className={button}
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause aria-hidden className="size-5 fill-current" />
          ) : (
            <Play aria-hidden className="size-5 fill-current" />
          )}
        </button>
        <span className="ml-1 text-sm font-semibold tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          className={button}
          onClick={onRate}
          disabled={disabled}
          aria-label={`Playback speed ${rate.toFixed(1)}x`}
        >
          {rate.toFixed(1)}x
        </button>
        {hd && <span className="px-1.5 text-sm font-extrabold">HD</span>}
        {fullscreen && (
          <button
            type="button"
            className={button}
            onClick={fullscreen.toggle}
            aria-label={fullscreen.active ? 'Exit full screen' : 'Full screen'}
          >
            {fullscreen.active ? (
              <Minimize aria-hidden className="size-5" />
            ) : (
              <Maximize aria-hidden className="size-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
