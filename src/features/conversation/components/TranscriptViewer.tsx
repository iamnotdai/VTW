import { Languages } from 'lucide-react';
import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { getSpeaker } from '@/data/content';
import { cn } from '@/lib/cn';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation, DialogueLine } from '@/types/models';
import { SpeakerAvatar } from './SpeakerAvatar';

const lineKey = (line: DialogueLine) => `line:${line.id}`;

/** Browser-voice tuning of the line's speaker. */
function voiceFor(line: DialogueLine) {
  const voice = getSpeaker(line.speakerId)?.voice;
  return { pitch: voice?.pitch, rate: voice?.rate };
}

interface TranscriptViewerProps {
  conversation: Conversation;
  /** Show only the first N lines (preview). */
  limit?: number;
  /** `bubbles` = transcript screen, `compact` = "Mom: text" rows of the detail card. */
  variant?: 'bubbles' | 'compact';
}

/**
 * Screen 11 content (spec §9.3; design screens 11 and 15): each turn with the speaker's picture
 * and name, the English text, a listen button and an optional static translation. The current
 * line — the one playing, or the last one tapped — is highlighted and shows "Translate".
 */
export function TranscriptViewer({
  conversation,
  limit,
  variant = 'bubbles',
}: TranscriptViewerProps) {
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const playingKey = useAudioStore((state) => state.playingKey);
  const [translatedIds, setTranslatedIds] = useState<ReadonlySet<string>>(new Set());
  const lines = limit ? conversation.lines.slice(0, limit) : conversation.lines;
  const [selectedId, setSelectedId] = useState(lines[0]?.id);

  const playingLine = lines.find((line) => playingKey === lineKey(line));
  const currentId = playingLine?.id ?? selectedId;

  const toggleTranslation = (lineId: string) => {
    setSelectedId(lineId);
    setTranslatedIds((current) => {
      const next = new Set(current);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const translateButton = (line: DialogueLine, visible: boolean) =>
    showVietnamese &&
    line.textVi && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleTranslation(line.id);
        }}
        aria-pressed={translatedIds.has(line.id)}
        className={cn(
          'h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-4 text-[0.9375rem] font-bold text-brand-600 transition hover:bg-brand-100',
          // Only the current line shows it; keyboard users still reach every line's button.
          visible ? 'inline-flex' : 'sr-only focus-visible:not-sr-only focus-visible:inline-flex',
        )}
      >
        <Languages aria-hidden className="size-4" />
        {translatedIds.has(line.id) ? 'Hide' : 'Translate'}
      </button>
    );

  if (variant === 'compact') {
    return (
      <ol className="flex flex-col gap-4">
        {lines.map((line) => {
          const speaker = getSpeaker(line.speakerId);
          return (
            <li key={line.id} className="flex items-start gap-3">
              <SpeakerAvatar speakerId={line.speakerId} size={44} />
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[15px] font-medium text-navy-700">
                  <span className="font-bold text-coral-600">
                    {speaker?.name ?? line.speakerId}:
                  </span>{' '}
                  <span lang="en">{line.textEn}</span>
                </p>
                {showVietnamese && translatedIds.has(line.id) && line.textVi && (
                  <p lang="vi" className="mt-0.5 animate-fade-in text-sm font-medium text-navy-400">
                    {line.textVi}
                  </p>
                )}
              </div>
              {translateButton(line, true)}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {lines.map((line, index) => {
        const speaker = getSpeaker(line.speakerId);
        const current = line.id === currentId;
        const translated = translatedIds.has(line.id);
        return (
          <li
            key={line.id}
            aria-current={playingLine?.id === line.id ? 'true' : undefined}
            className="flex items-center gap-4"
          >
            <SpeakerAvatar speakerId={line.speakerId} size={64} />
            {/* Tapping a bubble makes it the current line; keyboard users use its buttons. */}
            {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              onClick={() => setSelectedId(line.id)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-4 pr-3 pl-5 transition sm:pl-6',
                current ? 'bg-white shadow-soft ring-1 ring-navy-100' : 'bg-mist',
                playingLine?.id === line.id && 'ring-2 ring-brand-300',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-navy-900 sm:text-xl">
                  {speaker?.name ?? line.speakerId}
                  <span className="sr-only">, line {index + 1}</span>
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p lang="en" className="text-[1.0625rem] font-medium text-navy-600 sm:text-lg">
                    {line.textEn}
                  </p>
                  {translateButton(line, current)}
                </div>
                {showVietnamese && translated && line.textVi && (
                  <p
                    lang="vi"
                    className="mt-1 animate-fade-in text-[15px] font-medium text-navy-400"
                  >
                    {line.textVi}
                  </p>
                )}
              </div>
              <AudioButton
                soundKey={lineKey(line)}
                text={line.textEn}
                src={line.audio}
                {...voiceFor(line)}
                label={`Play: ${line.textEn}`}
                variant="plain"
                size="lg"
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
