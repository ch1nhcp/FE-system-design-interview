import { MAIN_CONTENT_ID, NAV_SCROLL_CONTAINER_ATTRIBUTE } from '@/components/site/constants';
import { SectionsNav } from '@/components/site/sections-nav';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 px-4">
      <aside
        {...{ [NAV_SCROLL_CONTAINER_ATTRIBUTE]: '' }}
        className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto py-8 lg:block"
      >
        <SectionsNav />
      </aside>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="min-w-0 flex-1 py-8 outline-none sm:py-10">
        {children}
      </main>
    </div>
  );
}
