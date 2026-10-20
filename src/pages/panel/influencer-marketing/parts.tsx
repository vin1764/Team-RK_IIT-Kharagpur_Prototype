// Pieces of Influencer Marketing (reference/html/meesho-influencer-marketing.html).
import { useState } from 'react';
import { notInPrototype } from '../../../components/Toast';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const PRIMARY_BTN =
  'rounded-sm font-button border-none cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:touch-none disabled:bg-tertiary-text active:scale-90 bg-brand-primary-bg text-brand-foreground-text';

const PLAY = '/brand/msa/merlin/filled/play-white.svg';

/**
 * The page's videos weren't saved (deliberately). Each video slot is a still: a dark tile
 * the size of the <video> with the play icon; clicking it says videos aren't in the prototype.
 */
export function VideoStill({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cx('relative flex items-center justify-center bg-primary-text', className)} style={style} data-video-still>
      <img src={PLAY} alt="" width="24" height="24" />
    </div>
  );
}

export interface VideoTileData {
  title: string;
  /** Captured view / like counts (only the first three tiles show them). */
  views?: string;
  likes?: string;
}

export function VideoTile({ title, views, likes }: VideoTileData) {
  return (
    <button type="button" className="relative cursor-pointer p-0 border-0 bg-transparent" onClick={() => notInPrototype('Video')} aria-label={`${title} video`}>
      <VideoStill className="h-80 w-40 rounded-lg" />
      <div className="absolute top-0 left-0 right-0 p-3 rounded-t-lg bg-linear-to-t/srgb from-[#27282900] from-0% to-[#272829] to-100%">
        <div className="flex">
          <div className="rounded-full h-4.75 w-4.75 mr-1 bg-white" />
          <h6 className="m-0 p-0 text-sm leading-4 font-semibold font-button text-white">{title}</h6>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 rounded-b-lg bg-linear-to-b/srgb from-[#27282900] from-0% to-[#272829] to-100%">
        {views && likes && (
          <div className="flex justify-between">
            <div className="flex items-center justify-center">
              <img src="/brand/mimg/images/marketing/1725826773996.webp" alt="play" height="16" width="16" />
              <h4 className="m-0 p-0 font-bold font-heading text-xl leading-5 text-white ml-1">{views}</h4>
            </div>
            <div className="flex items-center justify-center">
              <img src="/brand/mimg/images/marketing/1725826842750.webp" alt="like" height="16" width="16" />
              <h4 className="m-0 p-0 font-bold font-heading text-xl leading-5 text-white ml-1">{likes}</h4>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// ── FAQ accordion ───────────────────────────────────────────────────────────
export function FaqItem({ q, defaultOpen = false, children }: { q: string; defaultOpen?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-4 py-3">
      <button
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bg-none bg-transparent border-none p-0 m-0 w-full flex justify-between items-start cursor-pointer box-border text-left text-xl font-semibold leading-5 text-primary-text font-[inherit] tracking-[inherit]"
        type="button"
      >
        {q}
        <img
          src="/brand/msa/merlin/lined/chevron-down-grey.svg"
          alt="chevron"
          width="24"
          height="24"
          className={cx('transition-transform duration-200 ease-in-out', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="text-lg leading-5 font-normal">
          {children ?? <div className="my-[13px] text-tertiary-text">Answer not available in this prototype.</div>}
        </div>
      )}
    </div>
  );
}

export function FaqSeparator() {
  return <div className="w-full h-[0.0625rem] border-0 border-b border-solid border-b-secondary-border border-l-0" role="separator" aria-orientation="horizontal" />;
}
