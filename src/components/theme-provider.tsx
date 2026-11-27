'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof NextThemesProvider>;

// next-themes renders an inline <script> that sets the theme before first paint.
// It only needs to run from the server HTML; when the layout re-renders on the client
// (e.g. switching locale), React 19 warns about rendering a script tag. Marking it
// non-executable on the client avoids that warning without changing behavior.
const clientScriptProps = typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

export function ThemeProvider(props: Props) {
  return <NextThemesProvider scriptProps={clientScriptProps} {...props} />;
}
