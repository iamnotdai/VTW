import { getSpeaker } from '@/data/content';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';

/**
 * Round portrait of a dialogue speaker (design screens 11 and 15): a face crop of the speaker's
 * picture, or a colored initial when there is no picture.
 */
export function SpeakerAvatar({
  speakerId,
  size = 56,
  className,
}: {
  speakerId: string;
  size?: number;
  className?: string;
}) {
  const speaker = getSpeaker(speakerId);
  const name = speaker?.name ?? speakerId;
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold text-white shadow-soft ring-[3px] ring-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: speaker?.avatar
          ? 'linear-gradient(180deg, #fff6ea, #f5e4cf)'
          : (speaker?.color ?? '#5468a8'),
        fontSize: size * 0.42,
      }}
    >
      {speaker?.avatar ? (
        <img
          src={assetUrl(speaker.avatar)}
          alt=""
          className="h-full w-full origin-[50%_8%] scale-[1.9] object-cover object-top"
          draggable={false}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
