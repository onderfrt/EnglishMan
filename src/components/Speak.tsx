import { canSpeak, speak } from '../lib/speech';

export function SpeakButton({
  text,
  rate,
  label = 'Dinle',
  icon = '🔊',
  className = 'icon-btn',
  caption,
}: {
  text: string;
  rate?: number;
  label?: string;
  icon?: string;
  className?: string;
  /** Simgenin yanında görünen yazı (ör. "Dinle"). */
  caption?: string;
}) {
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label={`${label}: ${text}`}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, rate);
      }}
    >
      {icon}
      {caption && <span>{caption}</span>}
    </button>
  );
}
