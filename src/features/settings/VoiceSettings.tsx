import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { cn } from '@/lib/cn';
import { isSpeechSynthesisSupported, listUsVoices, onVoicesChanged } from '@/lib/speech';
import { useSettingsStore } from '@/stores/settingsStore';
import type { VoiceStyle } from '@/types/models';

const SELECT_ID = 'settings-voice';
const SAMPLE_TEXT = 'Hello! This is how I sound.';

const STYLE_OPTIONS: readonly { value: VoiceStyle | null; label: string }[] = [
  { value: null, label: 'Automatic' },
  { value: 'boy', label: 'Boy voice' },
  { value: 'girl', label: 'Girl voice' },
];

/** Picks the US-English voice used when a word has no recorded audio. Saved immediately. */
export function VoiceSettings() {
  const voiceURI = useSettingsStore((state) => state.settings.voiceURI);
  const voiceStyle = useSettingsStore((state) => state.settings.voiceStyle);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [, setVoicesVersion] = useState(0);

  // Chrome loads voices asynchronously, so the list may be empty on first render.
  useEffect(() => onVoicesChanged(() => setVoicesVersion((version) => version + 1)), []);

  if (!isSpeechSynthesisSupported()) {
    return (
      <p className="rounded-xl bg-sun-50 p-4 text-sm font-semibold text-sun-700">
        This browser cannot read words aloud, so there is no voice to choose.
      </p>
    );
  }

  const voices = listUsVoices(voiceStyle);
  // A saved voice that this device no longer has (or that the style filtered out) means "Automatic".
  const selected = voices.some((voice) => voice.voiceURI === voiceURI) ? voiceURI : null;

  return (
    <section aria-labelledby="settings-voice-title" className="flex flex-col gap-3">
      <h2 id="settings-voice-title" className="text-base font-bold text-navy-900">
        Reading voice
      </h2>

      <div role="radiogroup" aria-label="Voice style" className="grid grid-cols-3 gap-2">
        {STYLE_OPTIONS.map((option) => {
          const checked = voiceStyle === option.value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => updateSettings({ voiceStyle: option.value, voiceURI: null })}
              className={cn(
                'h-12 rounded-xl border px-3 text-sm font-semibold transition outline-none focus-visible:ring-4 focus-visible:ring-brand-100',
                checked
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label htmlFor={SELECT_ID} className="text-sm font-medium text-navy-500">
        American English voice for words and sentences
      </label>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <select
            id={SELECT_ID}
            value={selected ?? ''}
            onChange={(event) => updateSettings({ voiceURI: event.target.value || null })}
            className="h-13 w-full cursor-pointer appearance-none rounded-xl border border-navy-200 bg-white pr-11 pl-4 text-[1.0625rem] font-medium text-navy-900 transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Automatic (best available)</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-navy-500"
          />
        </div>
        <AudioButton soundKey="voice-preview" text={SAMPLE_TEXT} label="Hear this voice" />
      </div>
      {voices.length === 0 && (
        <p className="text-xs font-medium text-navy-400">
          No American English voice was found on this device, so the browser default is used.
        </p>
      )}
    </section>
  );
}
