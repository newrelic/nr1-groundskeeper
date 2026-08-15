import React from 'react';
import { act } from 'react-dom/test-utils';

import Header from './Header';
import { renderComponent } from './testUtils';

describe('Header', () => {
  test('shows the comma-formatted count, private label, and no unsaved-changes text by default', () => {
    const { container } = renderComponent(<Header count={4182} />);

    expect(container.querySelector('.gs-header__meta').textContent).toBe(
      '4,182 apps · private'
    );
    expect(container.querySelector('.gs-header__dot')).toBeNull();
  });

  test('shows unsaved-changes text and the dot when hasUnsavedChanges is true', () => {
    const { container } = renderComponent(
      <Header count={4182} hasUnsavedChanges />
    );

    expect(container.querySelector('.gs-header__meta').textContent).toBe(
      '4,182 apps · private · unsaved changes'
    );
    expect(container.querySelector('.gs-header__dot')).not.toBeNull();
  });

  test('disables Save view when saveDisabled is true, enables it when false', () => {
    const { container: disabledContainer } = renderComponent(
      <Header saveDisabled />
    );
    const saveButton = Array.from(
      disabledContainer.querySelectorAll('.gs-header__actions button')
    ).find(el => el.textContent === 'Save view');
    expect(saveButton.disabled).toBe(true);

    const { container: enabledContainer } = renderComponent(
      <Header saveDisabled={false} />
    );
    const enabledSaveButton = Array.from(
      enabledContainer.querySelectorAll('.gs-header__actions button')
    ).find(el => el.textContent === 'Save view');
    expect(enabledSaveButton.disabled).toBe(false);
  });

  test('renders only the Save view action', () => {
    const { container } = renderComponent(<Header />);

    const actions = Array.from(
      container.querySelectorAll('.gs-header__actions button')
    ).map(el => el.textContent);
    expect(actions).toEqual(['Save view']);
  });

  test('renders the favorite control as a non-button element with a button role', () => {
    const { container } = renderComponent(<Header />);
    const favoriteControl = container.querySelector('.gs-header__favorite');

    expect(favoriteControl.tagName).not.toBe('BUTTON');
    expect(favoriteControl.getAttribute('role')).toBe('button');
    expect(favoriteControl.getAttribute('tabindex')).toBe('0');
  });

  test('toggles the favorite icon type on click', () => {
    const { container } = renderComponent(<Header />);
    const favoriteButton = container.querySelector('.gs-header__favorite');
    const icon = () => container.querySelector('.mock-icon');

    expect(icon().dataset.type).toBe('PROFILES__EVENTS__FAVORITE');
    expect(favoriteButton.getAttribute('aria-pressed')).toBe('false');

    favoriteButton.click();

    expect(icon().dataset.type).toBe('PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD');
    expect(favoriteButton.getAttribute('aria-pressed')).toBe('true');
  });

  test('toggles the favorite icon type on Enter/Space keydown', () => {
    const { container } = renderComponent(<Header />);
    const favoriteControl = container.querySelector('.gs-header__favorite');
    const icon = () => container.querySelector('.mock-icon');

    act(() => {
      favoriteControl.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });
    expect(icon().dataset.type).toBe('PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD');

    act(() => {
      favoriteControl.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      );
    });
    expect(icon().dataset.type).toBe('PROFILES__EVENTS__FAVORITE');
  });

  test('defaults count to 0 when not given', () => {
    const { container } = renderComponent(<Header />);

    expect(container.querySelector('.gs-header__meta').textContent).toContain(
      '0 apps'
    );
  });
});
