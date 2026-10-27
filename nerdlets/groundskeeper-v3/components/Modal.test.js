import React from 'react';

import Modal from './Modal';
import { renderComponent } from './testUtils';

describe('Modal', () => {
  test('renders its children when open', () => {
    const { container } = renderComponent(
      <Modal hidden={false}>
        <div data-testid="child">hello</div>
      </Modal>
    );
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  test('renders a close button', () => {
    const { container } = renderComponent(
      <Modal hidden={false}>
        <div>x</div>
      </Modal>
    );
    expect(
      container.querySelector('[aria-label="Close modal"]')
    ).not.toBeNull();
  });

  test('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    const { container } = renderComponent(
      <Modal hidden={false} onClose={onClose}>
        <div>x</div>
      </Modal>
    );
    container.querySelector('[aria-label="Close modal"]').click();
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onClose when the backdrop (dialog element) is clicked', () => {
    const onClose = jest.fn();
    const { container } = renderComponent(
      <Modal hidden={false} onClose={onClose}>
        <div>x</div>
      </Modal>
    );
    const dialog = container.querySelector('dialog.modal-dialog');
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalled();
  });

  test('does not call onClose when the click bubbles up from inside the frame', () => {
    const onClose = jest.fn();
    const { container } = renderComponent(
      <Modal hidden={false} onClose={onClose}>
        <div data-testid="child">x</div>
      </Modal>
    );
    container.querySelector('[data-testid="child"]').click();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('turns Escape (the dialog cancel event) into onClose instead of letting the dialog close itself', () => {
    const onClose = jest.fn();
    const { container } = renderComponent(
      <Modal hidden={false} onClose={onClose}>
        <div>x</div>
      </Modal>
    );
    const cancel = new Event('cancel', { cancelable: true });
    container.querySelector('dialog.modal-dialog').dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onShow when the slide-in animation ends', () => {
    const onShow = jest.fn();
    const { container } = renderComponent(
      <Modal hidden={false} onShow={onShow}>
        <div>x</div>
      </Modal>
    );
    const frame = container.querySelector('.modal-frame');
    expect(frame.className).toMatch(/slide-in/);
    frame.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(onShow).toHaveBeenCalled();
  });

  test('calls onHide when the slide-out animation ends after being hidden', () => {
    const onHide = jest.fn();
    const { container, rerender } = renderComponent(
      <Modal hidden={false} onHide={onHide}>
        <div>x</div>
      </Modal>
    );
    // Finish slide-in first.
    container
      .querySelector('.modal-frame')
      .dispatchEvent(new Event('animationend', { bubbles: true }));

    rerender(
      <Modal hidden onHide={onHide}>
        <div>x</div>
      </Modal>
    );
    const frame = container.querySelector('.modal-frame');
    expect(frame.className).toMatch(/slide-out/);
    frame.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(onHide).toHaveBeenCalled();
  });

  test('passes the style prop to the modal frame', () => {
    const { container } = renderComponent(
      <Modal hidden={false} style={{ '--modal-width': '600px' }}>
        <div>x</div>
      </Modal>
    );
    const frame = container.querySelector('.modal-frame');
    expect(frame.style.getPropertyValue('--modal-width')).toBe('600px');
  });
});
