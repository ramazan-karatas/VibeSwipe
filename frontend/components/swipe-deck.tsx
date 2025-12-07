import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type Direction = "up" | "down";

export type SwipeCard = {
  id: string;
  title: string;
  subtitle?: string;
  iconSrc?: string;
};

type Props = {
  cards: SwipeCard[];
  disabled?: boolean;
  onPick: (card: SwipeCard, dir: Direction) => Promise<void> | void;
  initialIndex?: number;
};

// Simple swipe deck with Framer Motion drag gestures.
export function SwipeDeck({ cards, disabled, onPick, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [pending, setPending] = useState(false);

  const active = cards[index];
  const next = cards[index + 1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  useEffect(() => {
    x.set(0);
  }, [index, x]);

  // Keep index in range if the card set shrinks after submissions.
  useEffect(() => {
    setIndex((i) => {
      if (cards.length === 0) return 0;
      const max = cards.length - 1;
      return i > max ? max : i;
    });
  }, [cards.length]);

  const handleDragEnd = async (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (disabled || pending) return;
    const threshold = 120;
    const dir: Direction | null = info.offset.x > threshold ? "up" : info.offset.x < -threshold ? "down" : null;
    if (!dir) {
      x.set(0);
      return;
    }
    if (!active) return;
    setPending(true);
    try {
      await onPick(active, dir);
      setIndex((i) => Math.min(cards.length, i + 1));
    } finally {
      setPending(false);
    }
  };

  if (!active) {
    return (
      <div className="h-64 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center text-sm text-[var(--muted)]">
        No more assets to pick.
      </div>
    );
  }

  return (
    <div className="relative h-80">
      {next ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 opacity-60 scale-95 blur-[1px]" />
        </div>
      ) : null}

      <motion.div
        className="absolute inset-0 mx-auto flex items-center justify-center"
        style={{ zIndex: 10, rotate, x, opacity }}
        drag={!disabled}
        dragSnapToOrigin
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          handleDragEnd(_, info);
        }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[rgba(10,14,26,0.9)] p-6 shadow-xl shadow-[rgba(0,0,0,0.45)] backdrop-blur relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-[var(--text)]">{active.title}</p>
              <p className="text-xs text-[var(--muted)]">{active.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Card</p>
              <p className="text-sm font-semibold text-[var(--text)]">
                {index + 1}/{cards.length}
              </p>
            </div>
          </div>

          <div className="relative mt-10 h-32 rounded-xl bg-gradient-to-br from-[rgba(125,243,192,0.12)] via-[rgba(244,195,104,0.1)] to-[rgba(6,8,18,0.8)] ring-1 ring-[var(--border)] overflow-hidden flex items-center justify-center">
            {active.iconSrc ? (
              <Image src={active.iconSrc} alt={active.title} width={64} height={64} className="drop-shadow-lg" />
            ) : (
              <span className="text-3xl font-black text-[var(--text)]">{active.title}</span>
            )}
          </div>

          <div className="mt-6 text-xs text-[var(--muted)]">
            Swipe right for Up, left for Down. {pending ? "Saving..." : isDragging ? "Release to confirm" : ""}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
