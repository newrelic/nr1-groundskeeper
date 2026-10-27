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

  test('shows the account name instead of the id when showAccountName is set', () => {
    const { container } = renderComponent(
      <EntitiesTable rows={[baseRow]} showAccountName />
    );

    expect(container.textContent).toContain('Demogorgon Prod');
    expect(container.textContent).not.toContain('1234567');
  });

  test('reports the Show account name switch to onToggleShowAccountName', () => {
    const onToggleShowAccountName = jest.fn();
    const { container } = renderComponent(
      <EntitiesTable
        rows={[baseRow]}
        onToggleShowAccountName={onToggleShowAccountName}
      />
    );

    const showAccountName = Array.from(
      container.querySelectorAll('.mock-switch')
    ).find(el => el.textContent === 'Show account name');
    showAccountName.querySelector('input').click();

    expect(onToggleShowAccountName).toHaveBeenCalledTimes(1);
  });

  test('sorts by the sorting prop', () => {
    const a = { ...baseRow, guid: 'a', name: 'alpha' };
    const b = { ...baseRow, guid: 'b', name: 'bravo' };
    const { container } = renderComponent(
      <EntitiesTable
        rows={[a, b]}
        sorting={{ name: 'name', direction: 'desc' }}
      />
    );

    expect(container.textContent.indexOf('bravo')).toBeLessThan(
      container.textContent.indexOf('alpha')
    );
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

  test('renders a dash in the Recommended Version column when current', () => {
    const { container } = renderComponent(
      <EntitiesTable rows={[{ ...baseRow, status: STATUS.CURRENT }]} />
    );

    expect(container.querySelector('.recommended-version')).toBeNull();
    expect(container.textContent).toContain('—');
  });

  test('renders a RecommendedVersion cell for rows that are not current', () => {
    const { container } = renderComponent(<EntitiesTable rows={[baseRow]} />);

    expect(
      container.querySelector('.recommended-version__label').textContent
    ).toBe('8.21.1');
  });

  test('renders "Upgrade required" for an EOL row with no recommendation', () => {
    const { container } = renderComponent(
      <EntitiesTable
        rows={[
          {
            ...baseRow,
            status: STATUS.EOL,
            recommendedVersion: undefined,
            reasons: undefined
          }
        ]}
      />
    );

    expect(
      container.querySelector('.recommended-version__label').textContent
    ).toBe('Upgrade required');
  });

  test('calls onShowUpgradePath with the row in one click on the Recommended Version cell', () => {
    const onShowUpgradePath = jest.fn();
    const { container } = renderComponent(
      <EntitiesTable rows={[baseRow]} onShowUpgradePath={onShowUpgradePath} />
    );

    container.querySelector('.recommended-version').click();

    expect(onShowUpgradePath).toHaveBeenCalledWith(baseRow);
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
