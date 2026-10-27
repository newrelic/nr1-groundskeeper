import React from 'react';
import { act } from 'react-dom/test-utils';

import ViewModal from './ViewModal';
import { renderComponent } from './testUtils';

const type = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    'value'
  ).set;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

// By its text, or its aria-label for an icon-only button.
const button = (container, label) =>
  Array.from(container.querySelectorAll('.view-modal button')).find(
    el => el.textContent === label || el.getAttribute('aria-label') === label
  );

const nameInput = container =>
  container.querySelector('.view-modal .mock-text-field input');
const defaultSwitch = container =>
  container.querySelector('.view-modal__default input');

describe('ViewModal', () => {
  test('has a header, a body and a footer with Cancel first and the action last', () => {
    const { container } = renderComponent(
      <ViewModal hidden={false} onSubmit={jest.fn()} />
    );

    expect(container.querySelector('.view-modal__header').textContent).toBe(
      'Save as new view'
    );
    expect(
      container.querySelector('.view-modal__body .view-modal__content')
    ).not.toBeNull();
    const footer = Array.from(
      container.querySelectorAll('.view-modal__footer button')
    );
    expect(footer.map(el => el.textContent)).toEqual(['Cancel', 'Save view']);
    expect(footer[1].dataset.variant).toBe('primary');
  });

  test("can't be saved without a name", () => {
    const { container } = renderComponent(
      <ViewModal hidden={false} onSubmit={jest.fn()} />
    );

    expect(button(container, 'Save view').disabled).toBe(true);
    type(nameInput(container), '   ');
    expect(button(container, 'Save view').disabled).toBe(true);
    type(nameInput(container), 'Go apps');
    expect(button(container, 'Save view').disabled).toBe(false);
  });

  test('submits the trimmed name and description, and the default switch', async () => {
    const onSubmit = jest.fn(async () => ({}));
    const { container } = renderComponent(
      <ViewModal hidden={false} onSubmit={onSubmit} />
    );

    type(nameInput(container), ' Go apps ');
    type(container.querySelector('.view-modal textarea'), ' For the Go team ');
    act(() => {
      defaultSwitch(container).click();
    });
    await act(async () => {
      button(container, 'Save view').click();
    });

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Go apps',
      description: 'For the Go team',
      isDefault: true
    });
  });

  test('shows the error when saving fails', async () => {
    const onSubmit = jest.fn(async () => ({ error: new Error('quota') }));
    const { container } = renderComponent(
      <ViewModal hidden={false} onSubmit={onSubmit} />
    );

    type(nameInput(container), 'Go apps');
    await act(async () => {
      button(container, 'Save view').click();
    });

    expect(container.querySelector('[role="alert"]').textContent).toBe(
      "Couldn't save: quota"
    );
  });

  describe('Settings', () => {
    const settings = (props = {}) => (
      <ViewModal
        hidden={false}
        mode={ViewModal.MODE.SETTINGS}
        initialTitle="Payments team"
        initialDescription="Checkout"
        onSubmit={jest.fn()}
        onDelete={jest.fn()}
        {...props}
      />
    );

    test("starts from the view's name, description and default", () => {
      const { container } = renderComponent(
        settings({ initialIsDefault: true })
      );

      expect(container.querySelector('h3').textContent).toBe('Settings');
      expect(nameInput(container).value).toBe('Payments team');
      expect(container.querySelector('.view-modal textarea').value).toBe(
        'Checkout'
      );
      expect(defaultSwitch(container).checked).toBe(true);
      expect(button(container, 'Save')).toBeTruthy();
    });

    test('names the default it would replace', () => {
      const { container } = renderComponent(
        settings({ otherDefaultTitle: 'All APM apps' })
      );

      expect(
        container.querySelector('.mock-switch__description').textContent
      ).toContain('instead of All APM apps');
    });

    test('offers Delete on a saved view, as an icon next to Cancel', () => {
      const onDelete = jest.fn();
      const { container } = renderComponent(settings({ onDelete }));

      const start = Array.from(
        container.querySelectorAll('.view-modal__footer-start button')
      );
      expect(start.map(el => el.textContent)).toEqual(['Cancel', '']);
      const remove = start[1];
      expect(remove.getAttribute('aria-label')).toBe('Delete view');
      expect(remove.dataset.variant).toBe('destructive');
      remove.click();

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    test("can't rename or delete a built-in view, only change the default", async () => {
      const onSubmit = jest.fn(async () => ({}));
      const { container } = renderComponent(
        settings({ builtIn: true, initialTitle: 'All APM apps', onSubmit })
      );

      expect(nameInput(container)).toBeNull();
      expect(
        container.querySelector('.view-modal__built-in-title').textContent
      ).toBe('All APM apps');
      expect(button(container, 'Delete view')).toBeUndefined();

      act(() => {
        defaultSwitch(container).click();
      });
      await act(async () => {
        button(container, 'Save').click();
      });
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true })
      );
    });
  });

  test('offers Delete only in Settings', () => {
    const { container } = renderComponent(
      <ViewModal hidden={false} onSubmit={jest.fn()} onDelete={jest.fn()} />
    );

    expect(button(container, 'Delete view')).toBeUndefined();
  });

  test('starts again from the given values each time it opens', () => {
    const props = { onSubmit: jest.fn(), initialTitle: 'Payments team' };
    const { container, rerender } = renderComponent(
      <ViewModal hidden={false} {...props} />
    );

    type(nameInput(container), 'Changed, then cancelled');
    rerender(<ViewModal hidden {...props} />);
    rerender(<ViewModal hidden={false} {...props} />);

    expect(nameInput(container).value).toBe('Payments team');
  });
});
