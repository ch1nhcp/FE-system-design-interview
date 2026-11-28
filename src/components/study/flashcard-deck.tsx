'use client';

import { ArrowLeftIcon, ArrowRightIcon, BookOpenCheckIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from '@/i18n/navigation';
import type { StudyTopic } from '@/lib/content/study-types';
import { SECTIONS } from '@/lib/topics/registry';
import { useProgressStore } from '@/stores/use-progress-store';

import { AnswerContent } from './answer-content';
import { ProgressFilter } from './progress-filter';
import type { ProgressFilterValue } from './progress-filter';

export function FlashcardDeck({ topics }: { topics: readonly StudyTopic[] }) {
  const t = useTranslations('Flashcards');
  const tStudy = useTranslations('Study');
  const tSections = useTranslations('Sections');
  const [index, setIndex] = useState(0);
  const [section, setSection] = useState('all');
  const [filter, setFilter] = useState<ProgressFilterValue>('all');
  const [revealed, setRevealed] = useState<string | null>(null);
  function goToCard(next: number) {
    setIndex(next);
    setRevealed(null);
  }
  const focusRequested = useRef(false);
  function focusAfterTransition(element: HTMLElement | null) {
    if (element && focusRequested.current) {
      focusRequested.current = false;
      element.focus();
    }
  }
  const progress = useProgressStore((state) => state.topics);
  const setStatus = useProgressStore((state) => state.setStatus);
  const cards = topics
    .filter(
      (topic) =>
        (section === 'all' || topic.sections.some((slug) => slug === section)) &&
        (filter === 'all' || progress[topic.topic] === 'review'),
    )
    .flatMap((topic) =>
      topic.cards.map((card) => ({ ...card, title: topic.title, contentLanguage: topic.contentLanguage })),
    );
  const position = Math.min(index, Math.max(0, cards.length - 1));
  const current = cards[position];
  const answerVisible = current !== undefined && revealed === current.id;
  return (
    <div className="flex flex-col gap-5">
      <FieldGroup className="sm:flex-row sm:items-end">
        <Field className="min-w-0 sm:flex-1">
          <FieldLabel htmlFor="flashcard-section">{tStudy('section')}</FieldLabel>
          <Select
            value={section}
            onValueChange={(value) => {
              setSection(value);
              goToCard(0);
            }}
          >
            <SelectTrigger id="flashcard-section" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{tStudy('allSections')}</SelectItem>
                {SECTIONS.map(({ slug }) => (
                  <SelectItem key={slug} value={slug}>
                    {tSections(`${slug}.title`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:shrink-0">
          <ProgressFilter
            value={filter}
            onChange={(value) => {
              setFilter(value);
              goToCard(0);
            }}
          />
        </div>
      </FieldGroup>
      <p role="status" aria-live="polite" className="text-muted-foreground text-sm tabular-nums">
        {current ? t('position', { current: position + 1, total: cards.length }) : t('noCards')}
      </p>
      {current ? (
        <Card>
          <CardHeader>
            <CardDescription>
              <Link
                href={`/topics/${current.topic}`}
                className="focus-visible:ring-ring/50 rounded-sm underline underline-offset-4 outline-none focus-visible:ring-3"
              >
                {current.title}
              </Link>
            </CardDescription>
            <CardTitle>
              <h2 key={current.id} ref={focusAfterTransition} tabIndex={-1} lang={current.contentLanguage}>
                {current.question}
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              aria-expanded={answerVisible}
              aria-controls="flashcard-answer"
              onClick={() => setRevealed(answerVisible ? null : current.id)}
            >
              {answerVisible ? t('hideAnswer') : t('showAnswer')}
            </Button>
            <div id="flashcard-answer" hidden={!answerVisible} lang={current.contentLanguage} className="mt-4">
              {answerVisible && <AnswerContent blocks={current.answer} />}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant={progress[current.topic] === 'learned' ? 'secondary' : 'outline'}
                aria-pressed={progress[current.topic] === 'learned'}
                onClick={() => {
                  focusRequested.current = filter === 'review';
                  if (filter === 'review') setRevealed(null);
                  setStatus(current.topic, 'learned');
                }}
              >
                <BookOpenCheckIcon aria-hidden data-icon="inline-start" />
                {t('markLearned')}
              </Button>
              <Button
                variant={progress[current.topic] === 'review' ? 'secondary' : 'outline'}
                aria-pressed={progress[current.topic] === 'review'}
                onClick={() => setStatus(current.topic, 'review')}
              >
                <RotateCcwIcon aria-hidden data-icon="inline-start" />
                {t('markReview')}
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">{t('progressHint')}</p>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <Button variant="ghost" disabled={position === 0} onClick={() => goToCard(position - 1)}>
              <ArrowLeftIcon aria-hidden data-icon="inline-start" />
              {t('previous')}
            </Button>
            <Button variant="ghost" disabled={position === cards.length - 1} onClick={() => goToCard(position + 1)}>
              {t('next')}
              <ArrowRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              ref={focusAfterTransition}
              variant="outline"
              onClick={() => {
                focusRequested.current = true;
                setFilter('all');
                setSection('all');
                goToCard(0);
              }}
            >
              {t('showAll')}
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
