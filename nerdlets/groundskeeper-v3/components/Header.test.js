import React from 'react';

import Header from './Header';
import { renderComponent } from './testUtils';

describe('Header', () => {
  test('renders the title, a comma-formatted count, and the synced time', () => {
    const { container } = renderComponent(
      <Header count={4182} syncedAt="14:22" />
    );

    expect(container.querySelector('.gs-header__title').textContent).toBe(
      'Agent Groundskeeper'
    );
    expect(container.querySelector('.gs-header__meta').textContent).toBe(
      '4,182 apps · synced 14:22'
    );
  });

  test('renders the Export and Help actions', () => {
    const { container } = renderComponent(<Header count={0} />);

    const actions = Array.from(
      container.querySelectorAll('.gs-header__actions button')
    ).map(el => el.textContent);
    expect(actions).toEqual(['Export', 'Help']);
  });

  test('defaults count to 0 when not given', () => {
    const { container } = renderComponent(<Header />);

    expect(container.querySelector('.gs-header__meta').textContent).toContain(
      '0 apps'
    );
  });
});
