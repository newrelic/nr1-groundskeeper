import React from 'react';

import UpgradePathModal from './UpgradePathModal';
import { STATUS } from '../constants';
import { renderComponent } from './testUtils';

const entity = {
  guid: 'g1',
  language: 'java',
  version: '7.4.0',
  recommendedVersion: '8.21.1',
  versionDiff: '8.0.1,8.21.1',
  status: STATUS.BEHIND
};

const releasesForLanguage = {
  '7.4.0': {
    date: new Date('2024-06-11T00:00:00Z'),
    eolDate: null,
    security: [],
    bugs: [],
    features: [],
    slug: 'java-agent-740'
  },
  '8.0.1': {
    date: new Date('2024-09-20T00:00:00Z'),
    eolDate: null,
    security: [],
    bugs: ['Fixed an older bug'],
    features: [],
    slug: 'java-agent-801'
  },
  '8.21.1': {
    date: new Date('2025-08-02T00:00:00Z'),
    eolDate: null,
    security: ['Fixed a request smuggling issue'],
    bugs: ['Fixed a bug'],
    features: ['Added a feature'],
    slug: 'java-agent-8211'
  }
};

const render = (props = {}) =>
  renderComponent(
    <UpgradePathModal
      entity={entity}
      releasesForLanguage={releasesForLanguage}
      hidden={false}
      {...props}
    />
  );

const text = (container, selector) =>
  container.querySelector(selector)?.textContent;

const titles = container =>
  Array.from(container.querySelectorAll('.viz-feed__title')).map(
    el => el.textContent
  );

describe('UpgradePathModal', () => {
  test('renders nothing when there is no entity yet', () => {
    const { container } = renderComponent(
      <UpgradePathModal entity={null} hidden />
    );
    expect(container.querySelector('.upgrade-path-modal')).toBeNull();
  });

  test('renders the header title and meta from versionDiff', () => {
    const { container } = render();

    expect(text(container, '.upgrade-path-modal__title')).toBe(
      'java agent · 7.4.0 → 8.21.1'
    );
    expect(text(container, '.upgrade-path-modal__meta')).toBe(
      '2 releases · 14 months'
    );
  });

  test('renders one Feed entry per category per version, newest first, instead of tabs', () => {
    const { container } = render();

    expect(container.querySelector('.mock-tabs')).toBeNull();
    expect(titles(container)).toEqual([
      '1 security fix',
      '1 bug fix',
      '1 new feature',
      '1 bug fix'
    ]);
    expect(container.querySelector('.viz-feed__text').textContent).toBe(
      '• Fixed a request smuggling issue'
    );
  });

  test('filters by tag with the Feed chips', () => {
    const { container } = render();

    const chips = Array.from(container.querySelectorAll('.viz-feed__chip'));
    expect(
      chips.map(el => el.firstChild.textContent || el.textContent)
    ).toEqual(expect.arrayContaining([expect.stringContaining('Security')]));
    chips.find(el => el.textContent.startsWith('Bug fix')).click();

    expect(titles(container)).toEqual(['1 bug fix', '1 bug fix']);
    expect(
      Array.from(container.querySelectorAll('.viz-feed__text')).map(
        el => el.textContent
      )
    ).toEqual(['• Fixed a bug', '• Fixed an older bug']);
  });

  test('links each entry to its release notes and shows the release date only', () => {
    const { container } = render();

    const link = container.querySelector('a.viz-feed__title');
    expect(link.getAttribute('href')).toBe(
      'https://docs.newrelic.com/java-agent-8211'
    );
    expect(text(container, '.viz-feed__time')).toBe('2025-08-02');
  });

  test('shows a versionDiff version missing from agentReleases without details', () => {
    const { container } = render({
      entity: { ...entity, versionDiff: '8.22.0' }
    });

    expect(text(container, '.viz-feed__label')).toBe('8.22.0');
    expect(titles(container)).toEqual(['No release details available.']);
  });

  test.each([undefined, ''])(
    'explains an empty history when versionDiff is %p',
    versionDiff => {
      const { container } = render({ entity: { ...entity, versionDiff } });

      expect(container.querySelector('.viz-feed__list')).toBeNull();
      expect(text(container, '.viz-feed__empty')).toBe(
        'No version history was reported for this upgrade.'
      );
      expect(text(container, '.upgrade-path-modal__meta')).toBe('14 months');
    }
  );

  test('explains an EOL app that is already on the recommended version', () => {
    const { container } = render({
      entity: {
        ...entity,
        recommendedVersion: '7.4.0',
        versionDiff: '',
        status: STATUS.EOL
      },
      releasesForLanguage: {
        ...releasesForLanguage,
        '7.4.0': {
          ...releasesForLanguage['7.4.0'],
          eolDate: new Date('2026-03-11T00:00:00Z')
        }
      }
    });

    expect(text(container, '.upgrade-path-modal__title')).toBe(
      'java agent · 7.4.0'
    );
    expect(text(container, '.upgrade-path-modal__meta')).toBe('EOL 2026-03-11');
    expect(text(container, '.upgrade-path-modal__notice')).toContain(
      'still the recommended version'
    );
    expect(text(container, '.viz-feed__empty')).toBe(
      'No newer versions to show.'
    );
  });

  test('explains an EOL app with no recommended version', () => {
    const { container } = render({
      entity: {
        ...entity,
        recommendedVersion: undefined,
        versionDiff: undefined,
        status: STATUS.EOL
      }
    });

    expect(text(container, '.upgrade-path-modal__title')).toBe(
      'java agent · 7.4.0'
    );
    expect(text(container, '.upgrade-path-modal__notice')).toContain(
      'no recommended version was reported'
    );
  });

  test('shows no notice for an app that is just behind', () => {
    const { container } = render();

    expect(container.querySelector('.upgrade-path-modal__notice')).toBeNull();
  });
});
