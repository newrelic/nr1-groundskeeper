import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'nr1';

// Ported from nr1-neon/src/components/modal -- nr1's own Modal is a small centered
// dialog, not styled for a side panel, so this uses the native <dialog> element
// directly to get a slide-in/out panel instead.
const ANIMATION_CLASSES = {
  SLIDE_IN: 'slide-in',
  SLIDE_OUT: 'slide-out'
};

const Modal = ({ hidden, onClose, onHide, onShow, style, children }) => {
  const [animClass, setAnimClass] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!hidden) {
      if (dialog.showModal) dialog.showModal();
      // showModal() auto-focuses the first focusable element; defer a blur so the slide-in animation isn't interrupted.
      setTimeout(() => dialog.querySelector?.(':focus')?.blur?.());
      setAnimClass(ANIMATION_CLASSES.SLIDE_IN);
    } else {
      setAnimClass(ANIMATION_CLASSES.SLIDE_OUT);
    }
  }, [hidden]);

  // Escape closes a native <dialog> on its own, without React knowing -- the
  // caller's `hidden` would stay false, so the next open would be a no-op and
  // showModal() never called again. Cancel that and route it through onClose
  // instead, so state and the slide-out animation stay in sync with a close
  // button/backdrop click. (A listener, since React 16 has no onCancel prop.)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const cancelHandler = e => {
      e.preventDefault();
      if (onClose) onClose();
    };
    dialog.addEventListener('cancel', cancelHandler);
    return () => dialog.removeEventListener('cancel', cancelHandler);
  }, [onClose]);

  // A click on the <dialog> element itself (not the inner frame) means the user clicked the backdrop.
  const clickHandler = e => {
    if (e.target === dialogRef.current && onClose) onClose();
  };

  const animationEndHandler = () => {
    if (animClass === ANIMATION_CLASSES.SLIDE_IN) {
      if (onShow) onShow();
    } else if (animClass === ANIMATION_CLASSES.SLIDE_OUT) {
      // Close is deferred to animationEnd so the slide-out animation plays before the dialog is removed from the a11y tree.
      if (onHide) onHide();
      if (dialogRef.current?.close) dialogRef.current.close();
    }
    setAnimClass('');
  };

  return (
    <dialog ref={dialogRef} className="modal-dialog" onClick={clickHandler}>
      <div
        className={`modal-frame ${animClass}`}
        style={style}
        onAnimationEnd={animationEndHandler}
      >
        <Button
          ariaLabel="Close modal"
          className="close-button"
          iconType={Button.ICON_TYPE.INTERFACE__SIGN__CLOSE}
          sizeType={Button.SIZE_TYPE.SMALL}
          variant={Button.VARIANT.TERTIARY}
          autoFocus={false}
          onClick={onClose}
        />
        <div className="modal-dialog-content">{children}</div>
      </div>
    </dialog>
  );
};

Modal.propTypes = {
  hidden: PropTypes.bool,
  style: PropTypes.object,
  onClose: PropTypes.func,
  onHide: PropTypes.func,
  onShow: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default Modal;
