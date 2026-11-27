import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';

import { FlowDiagram } from '@/components/visuals/flow-diagram/flow-diagram';
import { RaceAnimation } from '@/components/visuals/networking/race-animation';
import { RetryAnimation } from '@/components/visuals/networking/retry-animation';
import { LoadingAnimation } from '@/components/visuals/performance/loading-animation';
import { RateAnimation } from '@/components/visuals/performance/rate-animation';
import { VirtualizationAnimation } from '@/components/visuals/performance/virtualization-animation';
import { RealtimeTransportAnimation } from '@/components/visuals/realtime-transport/realtime-transport-animation';
import { RenderingTimelineAnimation } from '@/components/visuals/rendering-timeline/rendering-timeline-animation';
import { cn } from '@/lib/utils';

import { DeepDive, InterviewQuestion } from './disclosure';
import { TopicBodyLayout } from './topic-body-layout';
import { VisualPanel, VisualTab } from './visual-panel';

function ExternalAwareLink({ href = '', ...props }: ComponentProps<'a'>) {
  const isExternal = /^https?:\/\//.test(href);
  return <a href={href} {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})} {...props} />;
}

function Table(props: ComponentProps<'table'>) {
  return (
    <div className="my-4 overflow-x-auto">
      <table {...props} />
    </div>
  );
}

/** Code blocks scroll horizontally, so they must be reachable and scrollable with the keyboard. */
function CodeBlock({ className, ...props }: ComponentProps<'pre'>) {
  return (
    <pre
      tabIndex={0}
      className={cn(className, 'focus-visible:ring-ring/50 outline-none focus-visible:ring-3')}
      {...props}
    />
  );
}

/** Components available in topic MDX without imports. */
export const topicMdxComponents: MDXComponents = {
  wrapper: TopicBodyLayout,
  a: ExternalAwareLink,
  table: Table,
  pre: CodeBlock,
  VisualPanel,
  VisualTab,
  DeepDive,
  InterviewQuestion,
  RealtimeTransportAnimation,
  RenderingTimelineAnimation,
  FlowDiagram,
  RetryAnimation,
  RaceAnimation,
  RateAnimation,
  LoadingAnimation,
  VirtualizationAnimation,
};
