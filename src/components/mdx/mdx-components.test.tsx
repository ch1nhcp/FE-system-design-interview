import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { DeepDive, InterviewQuestion } from './disclosure';
import { topicMdxComponents } from './mdx-components';
import { TopicBodyLayout } from './topic-body-layout';
import { VisualPanel, VisualTab } from './visual-panel';

describe('VisualPanel', () => {
  it('shows one tab per visual and opens the first one', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <VisualPanel tabs={['animation', 'code']}>
        <VisualTab kind="animation">Moving picture</VisualTab>
        <VisualTab kind="code">Some code</VisualTab>
      </VisualPanel>,
    );

    const panel = screen.getByRole('region', { name: 'Visual' });
    expect(within(panel).getByRole('tab', { name: 'Animation' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Moving picture')).toBeVisible();

    await user.click(within(panel).getByRole('tab', { name: 'Code' }));

    expect(screen.getByText('Some code')).toBeVisible();
    expect(screen.queryByText('Moving picture')).not.toBeInTheDocument();
  });

  it('hides the tab list when there is a single visual', () => {
    renderWithIntl(
      <VisualPanel tabs={['diagram']}>
        <VisualTab kind="diagram">A diagram</VisualTab>
      </VisualPanel>,
    );

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText('A diagram')).toBeVisible();
  });
});

describe('InterviewQuestion', () => {
  it('folds the answer away until the question is opened', async () => {
    const user = userEvent.setup();
    renderWithIntl(<InterviewQuestion question="Why chain setTimeout?">Because of overlap.</InterviewQuestion>);

    expect(screen.getByText('Because of overlap.')).not.toBeVisible();

    await user.click(screen.getByText('Why chain setTimeout?'));

    expect(screen.getByText('Because of overlap.')).toBeVisible();
  });
});

describe('DeepDive', () => {
  it('is collapsed by default under a translated summary', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <DeepDive>
        <p>Edge cases</p>
      </DeepDive>,
    );

    expect(screen.getByText('Edge cases')).not.toBeVisible();

    await user.click(screen.getByText('Deep dive'));

    expect(screen.getByText('Edge cases')).toBeVisible();
  });
});

describe('topic MDX components', () => {
  it('wraps content in the topic layout', () => {
    const { container } = renderWithIntl(
      <TopicBodyLayout>
        <h2>TL;DR</h2>
      </TopicBodyLayout>,
    );

    expect(container.firstElementChild).toHaveClass('topic-prose', 'topic-body');
  });

  it('opens external links in a new tab only', () => {
    const Anchor = topicMdxComponents.a;
    if (typeof Anchor !== 'function') {
      throw new Error('Expected an anchor component');
    }
    renderWithIntl(
      <>
        <Anchor href="https://developer.mozilla.org">MDN</Anchor>
        <Anchor href="/topics/cors">CORS</Anchor>
      </>,
    );

    expect(screen.getByRole('link', { name: 'MDN' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'MDN' })).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getByRole('link', { name: 'CORS' })).not.toHaveAttribute('target');
  });

  it('makes code blocks keyboard focusable and wraps tables for horizontal scroll', () => {
    const Pre = topicMdxComponents.pre;
    const Table = topicMdxComponents.table;
    if (typeof Pre !== 'function' || typeof Table !== 'function') {
      throw new Error('Expected pre and table components');
    }
    const { container } = renderWithIntl(
      <>
        <Pre className="shiki">code</Pre>
        <Table>
          <tbody>
            <tr>
              <td>cell</td>
            </tr>
          </tbody>
        </Table>
      </>,
    );

    expect(container.querySelector('pre')).toHaveAttribute('tabindex', '0');
    expect(container.querySelector('pre')).toHaveClass('shiki');
    expect(container.querySelector('table')?.parentElement).toHaveClass('overflow-x-auto');
  });
});
