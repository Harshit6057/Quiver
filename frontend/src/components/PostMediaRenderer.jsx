import React, { useEffect, useMemo, useRef, useState } from 'react';

const inferType = (item) => {
  if (item?.type) return item.type;
  const url = item?.url || '';
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url)) return 'image';
  return 'document';
};

const PostMediaRenderer = ({ media = [] }) => {
  const videoRefs = useRef([]);
  const [playingMap, setPlayingMap] = useState({});

  const normalized = useMemo(() => {
    return (Array.isArray(media) ? media : [])
      .filter((item) => item && item.url)
      .map((item) => ({ ...item, type: inferType(item) }));
  }, [media]);

  useEffect(() => {
    if (!normalized.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoEl = entry.target;
          const idx = Number(videoEl.dataset.index);
          if (Number.isNaN(idx)) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            videoEl.play().catch(() => {});
            setPlayingMap((prev) => ({ ...prev, [idx]: true }));
          } else {
            videoEl.pause();
            setPlayingMap((prev) => ({ ...prev, [idx]: false }));
          }
        });
      },
      { threshold: [0.6] }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [normalized]);

  const togglePlay = (idx) => {
    const video = videoRefs.current[idx];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setPlayingMap((prev) => ({ ...prev, [idx]: true }));
    } else {
      video.pause();
      setPlayingMap((prev) => ({ ...prev, [idx]: false }));
    }
  };

  if (!normalized.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {normalized.map((item, idx) => {
        if (item.type === 'image') {
          return (
            <img
              key={`${item.url}-${idx}`}
              src={item.url}
              alt={item.name || `attachment-${idx + 1}`}
              className="w-full rounded-xl border border-white/10 object-cover max-h-[480px]"
              loading="lazy"
            />
          );
        }

        if (item.type === 'video') {
          return (
            <div key={`${item.url}-${idx}`} className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40">
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                data-index={idx}
                src={item.url}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full max-h-[480px]"
              />
              <button
                onClick={() => togglePlay(idx)}
                className="absolute bottom-3 right-3 bg-black/70 text-white rounded-full p-2 hover:bg-black/85 transition-colors"
                type="button"
                aria-label={playingMap[idx] ? 'Pause video' : 'Play video'}
              >
                <span className="material-symbols-outlined text-base">{playingMap[idx] ? 'pause' : 'play_arrow'}</span>
              </button>
            </div>
          );
        }

        return (
          <a
            key={`${item.url}-${idx}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-secondary">description</span>
            <span className="truncate text-sm">{item.name || 'Open document'}</span>
          </a>
        );
      })}
    </div>
  );
};

export default PostMediaRenderer;
