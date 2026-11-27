import type { ReactNode } from 'react';

/**
 * MDX `wrapper` for topic and section content. MDX passes the whole document as a single child, so the layout is
 * done in CSS (`.topic-body` in globals.css): on wide screens a `<VisualPanel>` moves into a sticky side column,
 * on narrow screens it stays where the author placed it, right after the TL;DR.
 */
export function TopicBodyLayout({ children }: { children?: ReactNode }) {
  return <div className="topic-prose topic-body">{children}</div>;
}
