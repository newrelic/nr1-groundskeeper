import React from 'react';

import SummaryTiles from './SummaryTiles';
import { Icon } from 'nr1';

import { STATUS } from '../constants';
import { renderComponent } from './testUtils';

describe('SummaryTiles', () => {
  test('renders all four tiles with their counts', () => {
    const { container } = renderComponent(
      <SummaryTiles
        counts={{
          [STATUS.CURRENT]: 612,
          [STATUS.BEHIND]: 1940,
          securityFixes: 288,
          [STATUS.EOL]: 74
        }}
      />
    );

    const tiles = container.querySelectorAll('.summary-tiles__tile');
    expect(tiles).toHaveLength(4);

    const labels = Array.from(
      container.querySelectorAll('.summary-tiles__label')
    ).map(el => el.textContent);
    expect(labels).toEqual(['Current', 'Behind', 'Security fixes', 'Past EOL']);

    const values = Array.from(
      container.querySelectorAll('.summary-tiles__value')
    ).map(el => el.textContent);
    expect(values).toEqual(['612', '1,940', '288', '74']);
  });

  test('gives Behind the warning variant and Security fixes/Past EOL the critical variant', () => {
    const { container } = renderComponent(<SummaryTiles counts={{}} />);

    const tiles = container.querySelectorAll('.summary-tiles__tile');
    expect(tiles[0].className).toBe('summary-tiles__tile');
    expect(tiles[1].className).toContain('summary-tiles__tile--warning');
    expect(tiles[2].className).toContain('summary-tiles__tile--critical');
    expect(tiles[3].className).toContain('summary-tiles__tile--critical');
  });

  test('defaults every count to 0 when none are given', () => {
    const { container } = renderComponent(<SummaryTiles />);

    const values = Array.from(
      container.querySelectorAll('.summary-tiles__value')
    ).map(el => el.textContent);
    expect(values).toEqual(['0', '0', '0', '0']);
  });

  test('gives each tile its own icon', () => {
    const { container } = renderComponent(<SummaryTiles />);

    const icons = Array.from(
      container.querySelectorAll('.summary-tiles__label .mock-icon')
    ).map(el => el.dataset.type);
    expect(icons).toEqual([
      Icon.TYPE.INTERFACE__SIGN__CHECKMARK,
      Icon.TYPE.INTERFACE__STATE__WARNING,
      Icon.TYPE.INTERFACE__OPERATIONS__SHIELD,
      Icon.TYPE.INTERFACE__STATE__CRITICAL
    ]);
  });
});
