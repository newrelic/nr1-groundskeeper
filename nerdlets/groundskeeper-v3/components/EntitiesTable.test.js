import React from 'react';

import EntitiesTable from './EntitiesTable';
import { STATUS } from '../constants';
import { renderComponent } from './testUtils';

const baseRow = {
  guid: 'g1',
  name: 'checkout-api',
  language: 'java',
  version: '7.4.0',
  recommendedVersion: '8.21.1',
  accountId: 1234567,
  tags: { account: ['Demogorgon Prod'] },
  status: STATUS.BEHIND,
  reasons: 'BUG_FIXES'
};

describe('EntitiesTable', () => {
  test('renders the app name and the account id by default', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    expect(container.textContent).toContain('checkout-api');
    expect(container.textContent).toContain('1234567');
    expect(container.textContent).not.toContain('Demogorgon Prod');
  });

  test('switches the Account column to the account name when Show account name is checked', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    const showAccountName = Array.from(
      container.querySelectorAll('.mock-switch')
    ).find(el => el.textContent === 'Show account name');
    showAccountName.querySelector('input').click();

    expect(container.textContent).toContain('Demogorgon Prod');
    expect(container.textContent).not.toContain('1234567');
  });

  test('renders the toolbar Hide current switch from props and calls onToggleHideCurrent', () => {
    const onToggleHideCurrent = jest.fn();
    const { container } = renderComponent(
      <EntitiesTable
        rows={[baseRow]}
        hideCurrent
        onToggleHideCurrent={onToggleHideCurrent}
      />
    );

    const hideCurrentSwitch = Array.from(
      container.querySelectorAll('.mock-switch')
    ).find(el => el.textContent === 'Hide current');
    const input = hideCurrentSwitch.querySelector('input');
    expect(input.checked).toBe(true);

    input.click();

    expect(onToggleHideCurrent).toHaveBeenCalledTimes(1);
  });

  test('renders the language column', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    expect(container.textContent).toContain('java');
  });

  test('renders a dash in the Target column when current', () => {
    const { container } = renderComponent(
      <EntitiesTable rows={[{ ...baseRow, status: STATUS.CURRENT }]} />
    );

    expect(container.querySelector('.mock-inline-message')).toBeNull();
  });

  test('renders a WARNING InlineMessage when behind with no security fix', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    const message = container.querySelector('.mock-inline-message');
    expect(message.dataset.type).toBe('warning');
    expect(
      container.querySelector('.mock-inline-message__label').textContent
    ).toBe('8.21.1');
    expect(
      container.querySelector('.mock-inline-message__description').textContent
    ).toBe('Includes bug fixes.');
  });

  test('renders a CRITICAL InlineMessage when behind with a security fix', () => {
    const { container } = renderComponent(
      <EntitiesTable
        rows={[{ ...baseRow, reasons: 'SECURITY_VULNERABILITY_FIXES' }]}
      />
    );

    expect(container.querySelector('.mock-inline-message').dataset.type).toBe(
      'critical'
    );
  });

  test('renders a CRITICAL InlineMessage when past EOL, even with no security fix', () => {
    const { container } = renderComponent(
      <EntitiesTable
        rows={[{ ...baseRow, status: STATUS.EOL, reasons: 'BUG_FIXES' }]}
      />
    );

    expect(container.querySelector('.mock-inline-message').dataset.type).toBe(
      'critical'
    );
  });

  test('renders the Status column as a Badge matching the row status', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    const badge = container.querySelector('.mock-badge');
    expect(badge.dataset.type).toBe('warning');
    expect(badge.textContent).toBe('Behind');
  });

  test('defaults to sorting rows by Status severity: EOL, then BEHIND, then CURRENT', () => {
    const current = { ...baseRow, guid: 'g-current', status: STATUS.CURRENT };
    const behind = { ...baseRow, guid: 'g-behind', status: STATUS.BEHIND };
    const eol = { ...baseRow, guid: 'g-eol', status: STATUS.EOL };

    const { container } = renderComponent(
      <EntitiesTable rows={[current, eol, behind]} />
    );

    const badgeTypes = Array.from(
      container.querySelectorAll('.mock-badge')
    ).map(el => el.dataset.type);
    expect(badgeTypes).toEqual(['critical', 'warning', 'success']);
  });
});
