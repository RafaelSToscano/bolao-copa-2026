"use client";

import { ReactNode } from "react";

interface StickySectionHeaderProps {
  children: ReactNode;
}

/**
 * Header that sticks to the viewport top while the user scrolls
 * inside its section. It takes over from the previous section's
 * sticky header at the boundary, then is replaced by the next
 * section's header once the user scrolls past this section.
 *
 * Mobile reserves 56px at the top for AppLayout's hamburger header
 * (sticky too); desktop sidebar layout doesn't have a top header so
 * we anchor at 0.
 */
export function StickySectionHeader({ children }: StickySectionHeaderProps) {
  return (
    <div className="sticky top-[56px] lg:top-0 z-20 -mx-4 md:-mx-6 lg:-mx-0 px-4 md:px-6 lg:px-0 py-4 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 border-b border-slate-800/60">
      {children}
    </div>
  );
}
