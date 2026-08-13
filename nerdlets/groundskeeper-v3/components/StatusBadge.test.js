import React from 'react';

import StatusBadge from './StatusBadge';
import { STATUS, STATUS_LABEL } from '../constants';
import { renderComponent } from './testUtils';

describe('StatusBadge', () => {
  test.each(Object.values(STATUS))(
    'renders the %s status with its label and a matching class',
    status => {
      const { container } = renderComponent(<StatusBadge status={status} />);
      const badge = container.querySelector('.status-badge');

      expect(badge.textContent).toBe(STATUS_LABEL[status]);
      expect(badge.className).toContain(`status-badge--${status}`);
    }
  );
});
