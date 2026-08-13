import React from 'react';

import SummaryTiles from './SummaryTiles';
import { STATUS } from '../constants';
import { renderComponent } from './testUtils';

describe('SummaryTiles', () => {
  test('renders all four tiles with their counts', () => {
    const { container } = renderComponent(
      <SummaryTiles
        counts={{
          [STATUS.CURRENT]: 612,
          [STATUS.BEHIND]: 1940,
          [STATUS.EOL]: 74
        }}
      />
    );

    const tiles = container.querySelectorAll('.summary-tiles__tile');
    expect(tiles).toHaveLength(4);

    const labels = Array.from(
      container.querySelectorAll('.summary-tiles__label')
    ).map(el => el.textContent);
    expect(labels).toEqual([
      'Up to date',
      'Behind',
      'CVE exposed',
      'Stale / EOL'
    ]);

    const values = Array.from(
      container.querySelectorAll('.summary-tiles__value')
    ).map(el => el.textContent);
    expect(values).toEqual(['612', '1,940', '0', '74']);
  });

  test('defaults every count to 0 when none are given', () => {
    const { container } = renderComponent(<SummaryTiles />);

    const values = Array.from(
      container.querySelectorAll('.summary-tiles__value')
    ).map(el => el.textContent);
    expect(values).toEqual(['0', '0', '0', '0']);
  });
});
