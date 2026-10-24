import { describe, expect, it } from 'vitest';
import { bestVoice } from './speech';

const v = (name: string, lang = 'en-US', voiceURI = name, isDefault = false) => ({ name, lang, voiceURI, default: isDefault });

describe('otomatik ses seçimi', () => {
  it('iOS: varsayılan erkek ses (Daniel) yerine kadın sesini seçer', () => {
    expect(bestVoice([v('Daniel', 'en-GB', 'd', true), v('Samantha'), v('Fred')])?.name).toBe('Samantha');
  });
  it('Windows/Edge: doğal kadın sesi en üstte', () => {
    const voices = [v('Microsoft David - English (United States)'), v('Microsoft Zira - English (United States)'), v('Microsoft Aria Online (Natural) - English (United States)')];
    expect(bestVoice(voices)?.name).toContain('Aria');
  });
  it('Chrome: Google US English, UK English Male yerine', () => {
    expect(bestVoice([v('Google UK English Male', 'en-GB'), v('Google US English')])?.name).toBe('Google US English');
  });
  it('Android: ses kimliğinden kadın sesini tanır', () => {
    const voices = [v('English United States', 'en-US', 'en-us-x-iom-local', true), v('English United States', 'en-US', 'en-us-x-sfg-local')];
    expect(bestVoice(voices)?.voiceURI).toBe('en-us-x-sfg-local');
  });
  it('robotik eğlence seslerini seçmez', () => {
    expect(bestVoice([v('Zarvox'), v('Trinoids'), v('Karen', 'en-AU')])?.name).toBe('Karen');
  });
});
