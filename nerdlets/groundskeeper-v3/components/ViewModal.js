import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  HeadingText,
  MultilineTextField,
  Switch,
  TextField
} from 'nr1';

import Modal from './Modal';

const MODE = { CREATE: 'create', SETTINGS: 'settings' };

const COPY = {
  [MODE.CREATE]: { heading: 'Save as new view', submit: 'Save view' },
  [MODE.SETTINGS]: { heading: 'Settings', submit: 'Save' }
};

// A view's name, description and whether it's the user's default: for a new
// view (the listing's New view, or Save as new view on an open one), or the
// open view's Settings. A built-in view can't be renamed, so its Settings only
// change the default; a saved view's also offer Delete.
//
// `onSubmit({ title, description, isDefault })` resolves to `{ error }`; the
// modal stays open, showing the error, if there is one. The header and footer
// stay put and the fields between them scroll.
const ViewModal = ({
  hidden,
  mode,
  builtIn,
  initialTitle,
  initialDescription,
  initialIsDefault,
  otherDefaultTitle,
  onSubmit,
  onDelete,
  onClose
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Start from the given values each time it opens.
  useEffect(() => {
    if (hidden) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setIsDefault(initialIsDefault);
    setSaving(false);
    setError(null);
  }, [hidden, initialTitle, initialDescription, initialIsDefault]);

  const trimmedTitle = title.trim();
  const canSubmit = (builtIn || trimmedTitle) && !saving;

  const submit = async event => {
    if (event) event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const { error: submitError } =
      (await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        isDefault
      })) || {};
    setSaving(false);
    if (submitError) setError(submitError);
  };

  const { heading, submit: submitLabel } = COPY[mode];
  const defaultHint = otherDefaultTitle
    ? `Opens when you launch the app, instead of ${otherDefaultTitle}. You can have one default view.`
    : 'Opens when you launch the app. You can have one default view.';

  return (
    <Modal hidden={hidden} onClose={onClose}>
      <form className="view-modal" onSubmit={submit}>
        <div className="view-modal__header">
          <HeadingText type={HeadingText.TYPE.HEADING_3}>{heading}</HeadingText>
        </div>
        <div className="view-modal__body">
          <div className="view-modal__content">
            {builtIn ? (
              <div className="view-modal__built-in">
                <div className="view-modal__built-in-title">{initialTitle}</div>
                {initialDescription ? <p>{initialDescription}</p> : null}
                <p className="view-modal__note">
                  Built-in views can&apos;t be renamed or deleted. To change
                  this one, use Save as new view.
                </p>
              </div>
            ) : (
              <>
                <TextField
                  label="Name"
                  placeholder="e.g. Payments team, Java apps"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <MultilineTextField
                  label="Description"
                  placeholder="Optional. Who is this view for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <p className="view-modal__note">
                  Views are shared with everyone in this account.
                </p>
              </>
            )}
            <Switch
              className="view-modal__default"
              label="Set as default view"
              description={defaultHint}
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
            />
            {error ? (
              <div className="view-modal__error" role="alert">
                Couldn&apos;t save: {error.message || 'unknown error'}
              </div>
            ) : null}
          </div>
        </div>
        <div className="view-modal__footer">
          <div className="view-modal__footer-start">
            <Button disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            {mode === MODE.SETTINGS && !builtIn && onDelete ? (
              <Button
                variant={Button.VARIANT.DESTRUCTIVE}
                iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__TRASH}
                ariaLabel="Delete view"
                disabled={saving}
                onClick={onDelete}
              />
            ) : null}
          </div>
          <Button
            variant={Button.VARIANT.PRIMARY}
            disabled={!canSubmit}
            loading={saving}
            onClick={submit}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

ViewModal.MODE = MODE;

ViewModal.propTypes = {
  hidden: PropTypes.bool,
  mode: PropTypes.oneOf(Object.values(MODE)),
  builtIn: PropTypes.bool,
  initialTitle: PropTypes.string,
  initialDescription: PropTypes.string,
  initialIsDefault: PropTypes.bool,
  // The current default view's title, when it's a different view.
  otherDefaultTitle: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onClose: PropTypes.func
};

ViewModal.defaultProps = {
  hidden: true,
  mode: MODE.CREATE,
  builtIn: false,
  initialTitle: '',
  initialDescription: '',
  initialIsDefault: false,
  otherDefaultTitle: null
};

export default ViewModal;
