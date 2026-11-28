import type { Locale } from 'next-intl';

import type { SectionSlug, TopicSlug } from '@/lib/topics/registry';

import type { Flashcard } from './flashcards';

export type StudyTopic = {
  topic: TopicSlug;
  title: string;
  description: string;
  sections: readonly SectionSlug[];
  contentLanguage: Locale;
  cards: readonly Flashcard[];
};
