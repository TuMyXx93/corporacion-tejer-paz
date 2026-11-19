import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  isNextOptimizableImage,
  parseVideoEmbed,
} from '@/lib/media/embeds';

describe('Media Embeds & Helpers', () => {
  it('parses standard YouTube, short youtu.be, Shorts, and Live URLs to privacy-enhanced embed', () => {
    const watch = parseVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(watch).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      embedUrl:
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      providerLabel: 'YouTube',
    });

    const short = parseVideoEmbed('https://youtu.be/abcDEF123_-');
    expect(short?.provider).toBe('youtube');
    expect(short?.videoId).toBe('abcDEF123_-');

    const shorts = parseVideoEmbed('https://youtube.com/shorts/abcDEF123_-');
    expect(shorts?.videoId).toBe('abcDEF123_-');

    const live = parseVideoEmbed('https://www.youtube.com/live/abcDEF123_-');
    expect(live?.videoId).toBe('abcDEF123_-');

    const embed = parseVideoEmbed('https://www.youtube-nocookie.com/embed/abcDEF123_-');
    expect(embed?.videoId).toBe('abcDEF123_-');
  });

  it('parses Vimeo and player.vimeo.com URLs with DNT flag', () => {
    const vimeo = parseVideoEmbed('https://vimeo.com/123456789');
    expect(vimeo).toEqual({
      provider: 'vimeo',
      videoId: '123456789',
      embedUrl: 'https://player.vimeo.com/video/123456789?dnt=1',
      thumbnailUrl: null,
      canonicalUrl: 'https://vimeo.com/123456789',
      providerLabel: 'Vimeo',
    });

    const channel = parseVideoEmbed('https://vimeo.com/channels/staffpicks/987654321');
    expect(channel?.videoId).toBe('987654321');

    const player = parseVideoEmbed('https://player.vimeo.com/video/11223344');
    expect(player?.provider).toBe('vimeo');
    expect(player?.videoId).toBe('11223344');
  });

  it('returns external provider for generic https video links and rejects unsafe URLs', () => {
    const generic = parseVideoEmbed('https://cdn.example.org/videos/encuentro.mp4');
    expect(generic).toEqual({
      provider: 'external',
      videoId: null,
      embedUrl: null,
      thumbnailUrl: null,
      canonicalUrl: 'https://cdn.example.org/videos/encuentro.mp4',
      providerLabel: 'Video externo',
    });

    expect(parseVideoEmbed('')).toBeNull();
    expect(parseVideoEmbed('not-a-url')).toBeNull();
    expect(parseVideoEmbed('javascript:alert(1)')).toBeNull();
    expect(parseVideoEmbed('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('formats byte sizes cleanly and checks next/image optimizable hosts', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(-10)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2560)).toBe('2.5 KB');
    expect(formatFileSize(25_600)).toBe('25 KB');
    expect(formatFileSize(1_572_864)).toBe('1.5 MB');
    expect(formatFileSize(12_582_912)).toBe('12 MB');

    expect(isNextOptimizableImage('/images/hero.png')).toBe(true);
    expect(
      isNextOptimizableImage('https://abc.public.blob.vercel-storage.com/media/foto.jpg')
    ).toBe(false);
    expect(isNextOptimizableImage('https://pub-123.r2.dev/foto.jpg')).toBe(false);
    expect(isNextOptimizableImage('https://i.ytimg.com/vi/abc/hqdefault.jpg')).toBe(
      false
    );
    expect(isNextOptimizableImage('https://untrusted.example.com/foto.jpg')).toBe(false);
    expect(isNextOptimizableImage('invalid-url')).toBe(false);
  });
});
