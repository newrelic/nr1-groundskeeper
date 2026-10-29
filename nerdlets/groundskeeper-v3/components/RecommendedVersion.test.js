import React from 'react';
import { Icon } from 'nr1';

import RecommendedVersion, {
  NO_RECOMMENDATION_LABEL
} from './RecommendedVersion';
import { STATUS } from '../constants';
import { renderComponent } from './testUtils';

const behind = {
  guid: 'g1',
  version: '7.4.0',
  recommendedVersion: '8.21.1',
  status: STATUS.BEHIND,
  reasons: 'BUG_FIXES,NEW_FEATURES'
};

const iconType = container =>
  container.querySelector('.recommended-version .mock-icon').dataset.type;

describe('RecommendedVersion', () => {
  test('renders the recommended version in monospace', () => {
    const { container } = renderComponent(<RecommendedVersion item={behind} />);

    const label = container.querySelector('.recommended-version__label');
    expect(label.textContent).toBe('8.21.1');
    expect(label.className).toContain('recommended-version__label--version');
  });

  test('lists what the recommended version includes in its tooltip', () => {
    const { container } = renderComponent(<RecommendedVersion item={behind} />);

    expect(container.querySelector('.mock-tooltip__text').textContent).toBe(
      'Includes bug fixes and new features.'
    );
  });

  test.each([
    ['behind', behind, Icon.TYPE.INTERFACE__STATE__WARNING],
    [
      'behind with a security fix',
      { ...behind, reasons: 'BUG_FIXES,SECURITY_VULNERABILITY_FIXES' },
      Icon.TYPE.INTERFACE__OPERATIONS__SHIELD
    ],
    [
      'past EOL, even with a security fix',
      {
        ...behind,
        status: STATUS.EOL,
        reasons: 'SECURITY_VULNERABILITY_FIXES'
      },
      Icon.TYPE.INTERFACE__STATE__CRITICAL
    ]
  ])('shows the criticality icon when %s', (_name, item, type) => {
    const { container } = renderComponent(<RecommendedVersion item={item} />);

    expect(iconType(container)).toBe(type);
  });

  test('calls onClick with the row on a single click', () => {
    const onClick = jest.fn();
    const { container } = renderComponent(
      <RecommendedVersion item={behind} onClick={onClick} />
    );

    container.querySelector('.recommended-version').click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(behind);
  });

  test('does not let the click bubble up to select the row', () => {
    const onRowClick = jest.fn();
    const { container } = renderComponent(
      <div onClick={onRowClick}>
        <RecommendedVersion item={behind} />
      </div>
    );

    container.querySelector('.recommended-version').click();

    expect(onRowClick).not.toHaveBeenCalled();
  });

  // A native <button> is focusable and activates on Enter/Space by itself, so
  // keyboard users get the same one-step action as a click.
  test('is a keyboard-accessible button with a descriptive label', () => {
    const { container } = renderComponent(<RecommendedVersion item={behind} />);

    const button = container.querySelector('.recommended-version');
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-label')).toBe(
      '8.21.1. Includes bug fixes and new features. Show upgrade history.'
    );
  });

  describe('when past EOL with no recommendation', () => {
    const eolWithoutRecommendation = {
      ...behind,
      status: STATUS.EOL,
      recommendedVersion: undefined,
      reasons: undefined
    };

    test('shows "Upgrade required" instead of an empty label', () => {
      const { container } = renderComponent(
        <RecommendedVersion item={eolWithoutRecommendation} />
      );

      const label = container.querySelector('.recommended-version__label');
      expect(label.textContent).toBe(NO_RECOMMENDATION_LABEL);
      expect(label.className).not.toContain(
        'recommended-version__label--version'
      );
      expect(iconType(container)).toBe(Icon.TYPE.INTERFACE__STATE__CRITICAL);
    });

    test('explains why in the tooltip', () => {
      const { container } = renderComponent(
        <RecommendedVersion item={eolWithoutRecommendation} />
      );

      expect(container.querySelector('.mock-tooltip__text').textContent).toBe(
        'This version is past its end of life, and no recommended version was reported.'
      );
    });

    test('still opens the upgrade history on click', () => {
      const onClick = jest.fn();
      const { container } = renderComponent(
        <RecommendedVersion item={eolWithoutRecommendation} onClick={onClick} />
      );

      container.querySelector('.recommended-version').click();

      expect(onClick).toHaveBeenCalledWith(eolWithoutRecommendation);
    });
  });

  test('falls back to a generic tooltip when behind with no reasons', () => {
    const { container } = renderComponent(
      <RecommendedVersion item={{ ...behind, reasons: undefined }} />
    );

    expect(container.querySelector('.mock-tooltip__text').textContent).toBe(
      'A newer version is available.'
    );
  });
});
