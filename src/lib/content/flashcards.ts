import type { Nodes, PhrasingContent, Root, RootContent } from 'mdast';

import type { TopicSlug } from '@/lib/topics/registry';

export type AnswerInline =
  | { type: 'text' | 'code'; text: string }
  | { type: 'strong' | 'emphasis' | 'delete'; children: AnswerInline[] }
  | { type: 'link'; href: string; children: AnswerInline[] }
  | { type: 'break' };

export type AnswerBlock =
  | { type: 'paragraph'; children: AnswerInline[] }
  | { type: 'code'; code: string; language: string | null }
  | { type: 'list'; ordered: boolean; start: number; items: AnswerBlock[][] }
  | { type: 'quote'; children: AnswerBlock[] };

export type Flashcard = {
  id: string;
  topic: TopicSlug;
  question: string;
  answer: AnswerBlock[];
};

function inline(node: PhrasingContent): AnswerInline {
  switch (node.type) {
    case 'text':
      return { type: 'text', text: node.value };
    case 'inlineCode':
      return { type: 'code', text: node.value };
    case 'strong':
    case 'emphasis':
    case 'delete':
      return { type: node.type, children: node.children.map(inline) };
    case 'break':
      return { type: 'break' };
    case 'link': {
      const url = new URL(node.url, 'https://study.invalid');
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsafe flashcard link');
      return { type: 'link', href: node.url, children: node.children.map(inline) };
    }
    default:
      throw new Error(`Unsupported flashcard inline content: ${node.type}`);
  }
}

function block(node: RootContent): AnswerBlock {
  if (node.type === 'paragraph') return { type: 'paragraph', children: node.children.map(inline) };
  if (node.type === 'code') return { type: 'code', code: node.value, language: node.lang ?? null };
  if (node.type === 'blockquote') return { type: 'quote', children: node.children.map(block) };
  if (node.type === 'list')
    return {
      type: 'list',
      ordered: node.ordered ?? false,
      start: node.start ?? 1,
      items: node.children.map((item) => item.children.map(block)),
    };
  throw new Error(`Unsupported flashcard answer content: ${node.type}`);
}

/** Extract authored question/answer pairs without evaluating arbitrary MDX expressions. */
export function extractFlashcards(topic: TopicSlug, tree: Root): Flashcard[] {
  const cards: Flashcard[] = [];
  function visit(node: Nodes) {
    if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'InterviewQuestion') {
      if (node.type !== 'mdxJsxFlowElement') throw new Error(`Flashcard question in ${topic} must be a block`);
      const attribute = node.attributes.find(
        (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'question',
      );
      if (!attribute || !('value' in attribute) || typeof attribute.value !== 'string' || !attribute.value.trim()) {
        throw new Error(`Flashcard question in ${topic} must be a nonempty literal string`);
      }
      const answer = node.children.map(block);
      if (answer.length === 0) throw new Error(`Flashcard answer in ${topic} is empty`);
      cards.push({ id: `${topic}:${cards.length + 1}`, topic, question: attribute.value, answer });
      return;
    }
    if ('children' in node) node.children.forEach(visit);
  }
  visit(tree);
  return cards;
}
