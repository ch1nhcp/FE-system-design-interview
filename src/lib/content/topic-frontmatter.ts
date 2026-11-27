import { z } from 'zod';

import { isTopicSlug } from '@/lib/topics/registry';

export const TOPIC_VISUALS = ['animation', 'diagram', 'code'] as const;

/** Frontmatter of `content/topics/<slug>.mdx`. Titles come from the `Topics` messages so navigation is translated. */
export const topicFrontmatterSchema = z.object({
  /**
   * One-sentence summary shown under the title, on section pages and in search results.
   * Named `description` because that is the field Fumadocs indexes and expects in `PageData`.
   */
  description: z.string().min(1).max(200),
  /** The kind of visual the topic page shows next to the cheatsheet. */
  visual: z.enum(TOPIC_VISUALS),
  /** Other topics worth reading next, by slug. */
  related: z
    .array(z.string().refine(isTopicSlug, { message: 'Unknown topic slug' }))
    .max(6)
    .default([]),
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

/** Section overviews have no frontmatter yet; titles and descriptions come from the `Sections` messages. */
export const sectionFrontmatterSchema = z.object({});
