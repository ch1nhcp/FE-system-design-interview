import { z } from 'zod';

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
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;
