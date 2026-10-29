import React from 'react';
import { Badge } from 'nr1';

import StatusBadge from './StatusBadge';
import { STATUS, STATUS_ICON, STATUS_LABEL } from '../constants';
import { renderComponent } from './testUtils';

describe('StatusBadge', () => {
  test.each([
    [STATUS.CURRENT, Badge.TYPE.SUCCESS],
    [STATUS.BEHIND, Badge.TYPE.WARNING],
    [STATUS.EOL, Badge.TYPE.CRITICAL]
  ])('renders the %s status as a %s Badge with its label', (status, type) => {
    const { container } = renderComponent(<StatusBadge status={status} />);
    const badge = container.querySelector('.mock-badge');

    expect(badge.textContent).toBe(STATUS_LABEL[status]);
    expect(badge.dataset.type).toBe(type);
  });

  test.each(Object.values(STATUS))(
    'renders the %s status with its icon from STATUS_ICON',
    status => {
      const { container } = renderComponent(<StatusBadge status={status} />);
      const icon = container.querySelector('.status-badge .mock-icon');

      expect(icon.dataset.type).toBe(STATUS_ICON[status].type);
      // Not inside the Badge, which only renders strings.
      expect(container.querySelector('.mock-badge').textContent).toBe(
        STATUS_LABEL[status]
      );
    }
  );
});
