import { MAIN_CONTENT_ID } from '@/components/site/constants';

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 py-8 outline-none sm:py-10">
      {children}
    </main>
  );
}
