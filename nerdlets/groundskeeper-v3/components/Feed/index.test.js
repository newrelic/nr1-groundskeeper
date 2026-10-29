import React from 'react';

import Feed, { feedTags } from '.';
import { renderComponent } from '../testUtils';

const entries = [
  { key: 'a', label: '2.0.0', title: 'A security fix', tag: 'Security' },
  { key: 'b', label: '2.0.0', title: 'A bug fix', tag: 'Bug fix' },
  { key: 'c', label: '1.9.0', title: 'Another security fix', tag: 'Security' },
  { key: 'd', label: '1.8.0', title: 'Untagged' }
];

const titles = container =>
  Array.from(container.querySelectorAll('.viz-feed__title')).map(
    el => el.textContent
  );

describe('feedTags', () => {
  test('lists tags in first-seen order with counts, skipping untagged entries', () => {
    expect(feedTags(entries)).toEqual([
      { tag: 'Security', count: 2, color: null },
      { tag: 'Bug fix', count: 1, color: null }
    ]);
  });
});

describe('Feed', () => {
  test('renders every entry in the order given', () => {
    const { container } = renderComponent(<Feed entries={entries} />);

    expect(titles(container)).toEqual([
      'A security fix',
      'A bug fix',
      'Another security fix',
      'Untagged'
    ]);
  });

  test('filters to one tag when its chip is picked, and back with All', () => {
    const { container } = renderComponent(<Feed entries={entries} />);
    const chip = label =>
      Array.from(container.querySelectorAll('.viz-feed__chip')).find(el =>
        el.textContent.startsWith(label)
      );

    chip('Security').click();
    expect(titles(container)).toEqual([
      'A security fix',
      'Another security fix'
    ]);
    expect(chip('Security').getAttribute('aria-pressed')).toBe('true');

    chip('All').click();
    expect(titles(container)).toHaveLength(4);
  });

  test('renders the empty message when there are no entries', () => {
    const { container } = renderComponent(
      <Feed entries={[]} empty="Nothing here." />
    );

    expect(container.querySelector('.viz-feed__empty').textContent).toBe(
      'Nothing here.'
    );
    expect(container.querySelector('.viz-feed__chips')).toBeNull();
  });

  test('uses formatTime for entry times', () => {
    const { container } = renderComponent(
      <Feed entries={[{ title: 'x', time: 0 }]} formatTime={() => 'then'} />
    );

    expect(container.querySelector('.viz-feed__time').textContent).toBe('then');
  });
});
