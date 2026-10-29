import React from 'react';

import DetailPanel from './DetailPanel';
import { renderComponent } from './testUtils';

describe('DetailPanel', () => {
  test('renders nothing when there is no selected entity', () => {
    const { container } = renderComponent(<DetailPanel entity={null} />);

    expect(container.firstChild).toBeNull();
  });

  test('shows the version transition and age when behind', () => {
    const { container } = renderComponent(
      <DetailPanel
        entity={{
          name: 'checkout-api',
          language: 'java',
          accountId: 1234567,
          version: '7.4.0',
          recommendedVersion: '8.21.1',
          age: 'over 14 months old'
        }}
      />
    );

    expect(container.querySelector('.detail-panel__title').textContent).toBe(
      'checkout-api'
    );
    expect(container.querySelector('.detail-panel__meta').textContent).toBe(
      'java · acct 1234567'
    );
    expect(
      container.querySelector('.detail-panel__version-transition').textContent
    ).toBe('7.4.0 → 8.21.1');
    expect(container.querySelector('.detail-panel__age').textContent).toBe(
      'over 14 months old'
    );
  });

  test('shows "Running <version>" and no age when already current', () => {
    const { container } = renderComponent(
      <DetailPanel
        entity={{
          name: 'auth-edge',
          language: 'java',
          accountId: 1234567,
          version: '8.21.1',
          recommendedVersion: '8.21.1',
          age: null
        }}
      />
    );

    expect(
      container.querySelector('.detail-panel__version-transition').textContent
    ).toBe('Running 8.21.1');
    expect(container.querySelector('.detail-panel__age')).toBeNull();
  });

  test('shows "Running <version>" when ahead of the recommended version', () => {
    const { container } = renderComponent(
      <DetailPanel
        entity={{
          name: 'auth-edge',
          language: 'java',
          accountId: 1234567,
          version: '8.22.0',
          recommendedVersion: '8.21.1',
          age: null
        }}
      />
    );

    expect(
      container.querySelector('.detail-panel__version-transition').textContent
    ).toBe('Running 8.22.0');
  });

  test("lists the row's notes", () => {
    const { container } = renderComponent(
      <DetailPanel
        entity={{
          name: 'auth-edge',
          version: '13.4.0',
          notes: ['The newest agent release is 14.1.0.']
        }}
      />
    );

    expect(
      [...container.querySelectorAll('.detail-panel__note')].map(
        note => note.textContent
      )
    ).toEqual(['The newest agent release is 14.1.0.']);
  });

  test('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    const { container } = renderComponent(
      <DetailPanel
        entity={{ name: 'checkout-api', version: '8.21.1' }}
        onClose={onClose}
      />
    );

    container.querySelector('.detail-panel__close').click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
