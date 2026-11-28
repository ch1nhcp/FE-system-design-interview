import { readFileSync, readdirSync } from 'node:fs';

import { createProcessor } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';

import { isTopicSlug } from '@/lib/topics/registry';

import { extractFlashcards } from './flashcards';

describe('MDX flashcards', () => {
  it('extracts the authored question and preserves paragraphs and inline code in its answer', () => {
    const tree = createProcessor().parse(`
<InterviewQuestion question="What identifies a version?">

Use a strong \`ETag\`.

Keep the local draft while reconciling.

</InterviewQuestion>
`);
    expect(extractFlashcards('conflict-resolution', tree)).toEqual([
      {
        id: 'conflict-resolution:1',
        topic: 'conflict-resolution',
        question: 'What identifies a version?',
        answer: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Use a strong ' },
              { type: 'code', text: 'ETag' },
              { type: 'text', text: '.' },
            ],
          },
          { type: 'paragraph', children: [{ type: 'text', text: 'Keep the local draft while reconciling.' }] },
        ],
      },
    ]);
  });

  it('preserves links, emphasis, lists and code examples instead of flattening the answer', () => {
    const tree = createProcessor().parse(`
<InterviewQuestion question="How should I retry?">

Keep **one** owner and a *bounded* policy. Read [the guide](https://example.com/retries).

1. Keep context.
2. Retry safely.

\`\`\`ts
const budget = 3;
\`\`\`

</InterviewQuestion>
`);
    const card = extractFlashcards('retries', tree)[0]!;
    expect(card.answer).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Keep ' },
          { type: 'strong', children: [{ type: 'text', text: 'one' }] },
          { type: 'text', text: ' owner and a ' },
          { type: 'emphasis', children: [{ type: 'text', text: 'bounded' }] },
          { type: 'text', text: ' policy. Read ' },
          { type: 'link', href: 'https://example.com/retries', children: [{ type: 'text', text: 'the guide' }] },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'list',
        ordered: true,
        start: 1,
        items: [
          [{ type: 'paragraph', children: [{ type: 'text', text: 'Keep context.' }] }],
          [{ type: 'paragraph', children: [{ type: 'text', text: 'Retry safely.' }] }],
        ],
      },
      { type: 'code', language: 'ts', code: 'const budget = 3;' },
    ]);
  });

  it.each(readdirSync('content/topics').filter((file) => file.endsWith('.mdx')))(
    'builds usable cards from the real %s lesson',
    (file) => {
      const topic = file.split('.')[0] ?? '';
      if (!isTopicSlug(topic)) throw new Error(`Unknown topic in ${file}`);
      const source = readFileSync(`content/topics/${file}`, 'utf8');
      const cards = extractFlashcards(topic, createProcessor().parse(source));
      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(cards.length).toBeLessThanOrEqual(4);
      for (const card of cards) {
        expect(card.question.trim()).not.toBe('');
        expect(card.answer.length).toBeGreaterThan(0);
      }
      expect(new Set(cards.map(({ id }) => id)).size).toBe(cards.length);
    },
  );

  it('preserves quoted guidance and hard line breaks', () => {
    const tree = createProcessor().parse(
      '<InterviewQuestion question="Why?">\n\n> Keep context.\n>\n> Retry safely.\n\nFirst line.  \nSecond line.\n\n</InterviewQuestion>',
    );
    const answer = extractFlashcards('retries', tree)[0]!.answer;
    expect(answer[0]).toEqual({
      type: 'quote',
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'Keep context.' }] },
        { type: 'paragraph', children: [{ type: 'text', text: 'Retry safely.' }] },
      ],
    });
    expect(answer[1]).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', text: 'First line.' }, { type: 'break' }, { type: 'text', text: 'Second line.' }],
    });
  });

  it.each([
    '<InterviewQuestion question={dynamic}>Answer.</InterviewQuestion>',
    '<InterviewQuestion question="Empty"></InterviewQuestion>',
    '<InterviewQuestion question="Unsafe">\n\n[Open](javascript:alert)\n\n</InterviewQuestion>',
    '<InterviewQuestion question="Unsupported">\n\n<Unknown />\n\n</InterviewQuestion>',
  ])('rejects unsupported or unsafe authored card content', (source) => {
    expect(() => extractFlashcards('retries', createProcessor().parse(source))).toThrow();
  });
});
