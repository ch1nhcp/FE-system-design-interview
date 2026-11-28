import { useTranslations } from 'next-intl';

import type { AnswerBlock, AnswerInline } from '@/lib/content/flashcards';

function Inline({ nodes }: { nodes: readonly AnswerInline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return <span key={index}>{node.text}</span>;
      case 'code':
        return (
          <code key={index} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]">
            {node.text}
          </code>
        );
      case 'strong':
        return (
          <strong key={index}>
            <Inline nodes={node.children} />
          </strong>
        );
      case 'emphasis':
        return (
          <em key={index}>
            <Inline nodes={node.children} />
          </em>
        );
      case 'delete':
        return (
          <del key={index}>
            <Inline nodes={node.children} />
          </del>
        );
      case 'break':
        return <br key={index} />;
      case 'link':
        return (
          <a
            key={index}
            href={node.href}
            target={/^https?:/.test(node.href) ? '_blank' : undefined}
            rel="noreferrer"
            className="focus-visible:ring-ring/50 rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3"
          >
            <Inline nodes={node.children} />
          </a>
        );
    }
  });
}

export function AnswerContent({ blocks }: { blocks: readonly AnswerBlock[] }) {
  const t = useTranslations('Flashcards');
  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index}>
                <Inline nodes={block.children} />
              </p>
            );
          case 'code':
            return (
              <pre
                key={index}
                tabIndex={0}
                aria-label={t('codeExample')}
                className="bg-muted focus-visible:ring-ring/50 max-w-full overflow-x-auto rounded-lg p-4 text-xs outline-none focus-visible:ring-3"
              >
                <code>{block.code}</code>
              </pre>
            );
          case 'quote':
            return (
              <blockquote key={index} className="text-muted-foreground border-l-2 pl-4">
                <AnswerContent blocks={block.children} />
              </blockquote>
            );
          case 'list': {
            const items = block.items.map((item, i) => (
              <li key={i}>
                <AnswerContent blocks={item} />
              </li>
            ));
            return block.ordered ? (
              <ol key={index} start={block.start} className="flex list-decimal flex-col gap-2 pl-5">
                {items}
              </ol>
            ) : (
              <ul key={index} className="flex list-disc flex-col gap-2 pl-5">
                {items}
              </ul>
            );
          }
        }
      })}
    </div>
  );
}
