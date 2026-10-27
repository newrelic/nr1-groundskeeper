import React from 'react';
import { act } from 'react-dom/test-utils';

import ViewsList from './ViewsList';
import { ALL_APM_VIEW_ID } from '../constants';
import { renderComponent } from './testUtils';

const payments = {
  id: 'v-payments',
  title: 'Payments team',
  description: 'Checkout and billing',
  createdBy: { name: 'Pat Example' },
  createdAt: '2026-08-27T12:00:00.000Z'
};
const java = { id: 'v-java', title: 'Java apps' };

const handlers = () => ({
  onOpenView: jest.fn(),
  onToggleFavorite: jest.fn(),
  onSetDefault: jest.fn()
});

const sections = container =>
  Array.from(container.querySelectorAll('.views-list__section')).map(
    section => ({
      title: section.querySelector('.views-list__section-title').textContent,
      views: Array.from(section.querySelectorAll('.view-card__title')).map(
        el => el.textContent
      )
    })
  );

const card = (container, title) =>
  Array.from(container.querySelectorAll('.view-card')).find(
    el => el.querySelector('.view-card__title').textContent === title
  );

const type = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    'value'
  ).set;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

describe('ViewsList', () => {
  test('lists the built-in views and the saved views, alphabetically', () => {
    const { container } = renderComponent(
      <ViewsList views={[payments, java]} {...handlers()} />
    );

    expect(sections(container)).toEqual([
      { title: 'Built-in', views: ['All APM apps'] },
      { title: 'Saved views', views: ['Java apps', 'Payments team'] }
    ]);
  });

  test('puts favorites, built-in or saved, in their own section first', () => {
    const { container } = renderComponent(
      <ViewsList
        views={[payments, java]}
        favorites={{ [ALL_APM_VIEW_ID]: true, [payments.id]: true }}
        {...handlers()}
      />
    );

    expect(sections(container)).toEqual([
      { title: 'Favorites', views: ['All APM apps', 'Payments team'] },
      { title: 'Saved views', views: ['Java apps'] }
    ]);
  });

  test('shows who created a saved view, and that a built-in one is built-in', () => {
    const { container } = renderComponent(
      <ViewsList views={[payments]} {...handlers()} />
    );

    expect(
      card(container, 'Payments team').querySelector('.view-card__meta')
        .textContent
    ).toMatch(/^Created by Pat Example · /);
    expect(
      card(container, 'All APM apps').querySelector('.view-card__meta')
        .textContent
    ).toBe('Built-in');
  });

  test('opens a view from its title or anywhere on its card', () => {
    const h = handlers();
    const { container } = renderComponent(
      <ViewsList views={[payments]} {...h} />
    );

    card(container, 'Payments team')
      .querySelector('.view-card__title')
      .click();
    card(container, 'Payments team')
      .querySelector('.view-card__description')
      .click();

    expect(h.onOpenView.mock.calls).toEqual([[payments.id], [payments.id]]);
  });

  test('toggles a favorite without opening the view', () => {
    const h = handlers();
    const { container } = renderComponent(
      <ViewsList views={[payments]} {...h} />
    );

    const star = card(container, 'Payments team').querySelector(
      '.view-card__favorite'
    );
    expect(star.getAttribute('aria-pressed')).toBe('false');
    star.click();

    expect(h.onToggleFavorite).toHaveBeenCalledWith(payments.id);
    expect(h.onOpenView).not.toHaveBeenCalled();
  });

  test('marks the default view, and sets another without opening it', () => {
    const h = handlers();
    const { container } = renderComponent(
      <ViewsList views={[payments]} defaultViewId={payments.id} {...h} />
    );

    expect(
      card(container, 'Payments team').querySelector('.view-card__default')
        .textContent
    ).toBe('Default');

    card(container, 'All APM apps')
      .querySelector('.view-card__set-default')
      .click();

    expect(h.onSetDefault).toHaveBeenCalledWith(ALL_APM_VIEW_ID);
    expect(h.onOpenView).not.toHaveBeenCalled();
  });

  test('searches titles and descriptions', () => {
    const { container } = renderComponent(
      <ViewsList views={[payments, java]} {...handlers()} />
    );
    const search = container.querySelector('.mock-text-field input');

    type(search, 'billing');
    expect(sections(container)).toEqual([
      { title: 'Saved views', views: ['Payments team'] }
    ]);

    type(search, 'nothing like this');
    expect(container.querySelector('.views-list__empty').textContent).toBe(
      'No views match that search.'
    );
  });

  test('explains how to save a view when there are none', () => {
    const { container } = renderComponent(<ViewsList {...handlers()} />);

    expect(container.querySelector('.views-list__empty').textContent).toMatch(
      /^No saved views yet\./
    );
  });

  test('says when saved views are loading, or failed to load', () => {
    const { container, rerender } = renderComponent(
      <ViewsList loading {...handlers()} />
    );
    expect(container.querySelector('.views-list__loading')).not.toBeNull();
    expect(sections(container)[0].views).toEqual(['All APM apps']);

    rerender(<ViewsList error={new Error('boom')} {...handlers()} />);
    expect(container.querySelector('.views-list__empty').textContent).toBe(
      "Couldn't load saved views: boom"
    );
  });

  test('has no New view: views are saved from an open one', () => {
    const { container } = renderComponent(<ViewsList {...handlers()} />);

    expect(
      Array.from(container.querySelectorAll('button')).map(el => el.textContent)
    ).not.toContain('New view');
    expect(container.querySelector('.views-list__empty').textContent).toBe(
      'No saved views yet. Open a built-in view, filter it, and use Save as new view.'
    );
  });
});
