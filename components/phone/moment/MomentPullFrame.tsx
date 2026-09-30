"use client";

import { ReactNode, useRef, useState } from "react";

type MomentPullFrameProps = {
  heroImage: string;
  children: ReactNode;
};

export default function MomentPullFrame({
  heroImage,
  children,
}: MomentPullFrameProps) {
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullHeight, setPullHeight] = useState(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    } else {
      startYRef.current = null;
      pullingRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pullingRef.current || startYRef.current == null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      const nextHeight = Math.min(220, diff * 0.7);
      setPullHeight(nextHeight);
    } else {
      setPullHeight(0);
    }
  };

  const handleTouchEnd = () => {
    pullingRef.current = false;
    startYRef.current = null;
    setPullHeight(0);
  };

  return (
    <div
      className="moment-pull-frame"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="moment-pull-hero"
        style={{
          height: `${pullHeight}px`,
          backgroundImage: `url(${heroImage})`,
        }}
      />

      <div className="moment-pull-content">{children}</div>
    </div>
  );
}