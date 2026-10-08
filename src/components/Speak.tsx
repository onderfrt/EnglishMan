import { canSpeak, speak } from '../lib/speech';

export function SpeakButton({
  text,
  rate,
  label = 'Dinle',
  icon = '🔊',
}: {
  text: string;
  rate?: number;
  label?: string;
  icon?: string;
}) {
  if (!canSpeak()) return null;
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`${label}: ${text}`}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text, rate);
      }}
    >
      {icon}
    </button>
  );
}
