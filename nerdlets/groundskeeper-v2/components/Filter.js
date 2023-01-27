import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Badge, Button, Icon, Modal, SectionMessage, Switch } from 'nr1';
import { links, listTags } from '../filterer';

const Filter = ({
  filtered = {},
  selections,
  isAndOperator,
  setSelections,
  setIsAndOperator,
  updateFilteredGuids,
  setShowFilters
}) => {
  const [filteredGuids, setFilteredGuids] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showAll, setShowAll] = useState({
    modalHidden: true,
    type: null,
    tagIndex: -1
  });
  const [startupState, setStartupState] = useState({});

  const accountsSelections = useMemo(
    () =>
      links(
        filtered.accounts,
        5,
        index => clickHandler('accounts', index),
        selections.accounts.selected,
        () => showAllHandler('accounts')
      ),
    [filtered.accounts, selections.accounts.counter]
  );
  const languagesSelections = useMemo(
    () =>
      links(
        filtered.languages,
        7,
        index => clickHandler('languages', index),
        selections.languages.selected
      ),
    [filtered.languages, selections.languages.counter]
  );
  const tagSelections = useMemo(
    () =>
      listTags(
        filtered.tags,
        3,
        (index, tagIndex) => clickHandler('tags', index, tagIndex),
        selections.tags.selected,
        tagIndex => showAllHandler('tag', tagIndex)
      ),
    [filtered.tags, selections.tags.counter]
  );

  useEffect(() => {
    setStartupState({ selections, isAndOperator });

    return () => setStartupState({});
  }, []);

  useEffect(() => {
    const categories = ['accounts', 'languages', 'tags'];
    const selectedCategories = {};
    const selectedGuids = categories.reduce((acc, category) => {
      Object.keys(selections[category].selected).forEach(key => {
        if (!selections[category].selected[key]) return;
        if (category === 'tags') {
          Object.keys(selections[category].selected[key]).forEach(tagIndex => {
            if (!selections[category].selected[key][tagIndex]) return;
            selectedCategories[category] = null;
            filtered[category][key].values[tagIndex].guids.forEach(guid => {
              if (!(guid in acc)) acc[guid] = {};
              acc[guid][category] = null;
            });
          });
        } else {
          selectedCategories[category] = null;
          filtered[category][key].guids.forEach(guid => {
            if (!(guid in acc)) acc[guid] = {};
            acc[guid][category] = null;
          });
        }
      });
      return acc;
    }, {});
    const selectedCategoriesKeys = Object.keys(selectedCategories);
    setFilteredGuids(
      isAndOperator
        ? Object.keys(selectedGuids).filter(gu => {
            const guidCategoryKeys = Object.keys(selectedGuids[gu]);
            return selectedCategoriesKeys.every(cat =>
              guidCategoryKeys.includes(cat)
            );
          })
        : Object.keys(selectedGuids)
    );
  }, [selections, isAndOperator]);

  const showAllHandler = useCallback(
    (type, tagIndex) =>
      setShowAll({
        modalHidden: false,
        type,
        tagIndex: tagIndex || tagIndex === 0 ? tagIndex : -1
      }),
    []
  );

  const clickHandler = (type, index, tagIndex) => {
    const {
      [type]: { selected: typeSelections, counter: typeCounter }
    } = selections;
    let selected;
    if (type === 'tags') {
      const tagSelections = typeSelections[index] || {};
      tagSelections[tagIndex] = !tagSelections[tagIndex];
      selected = {
        ...typeSelections,
        [index]: tagSelections
      };
    } else {
      selected = {
        ...typeSelections,
        [index]: !typeSelections[index]
      };
    }

    setSelections(sel => ({
      ...sel,
      [type]: {
        selected,
        counter: typeCounter + 1
      }
    }));
  };

  const viewAppsHandler = useCallback(() => {
    updateFilteredGuids(filteredGuids);
  }, [filteredGuids]);

  const closeHandler = useCallback(() => {
    if ('selections' in startupState) setSelections(startupState.selections);
    if ('isAndOperator' in startupState)
      setIsAndOperator(startupState.isAndOperator);
    setShowFilters(false);
  }, []);

  const hideModal = useCallback(() => {
    setFilterText('');
    setShowAll({
      modalHidden: true,
      type: null,
      tagIndex: -1
    });
  }, []);

  const messageText = useMemo(
    () =>
      `Use the filters below to narrow down the apps to ${filtered.maxEntities}.`,
    [filtered.maxEntities]
  );

  const selectedTagText = useMemo(
    () => (showAll.tagIndex > -1 ? filtered.tags[showAll.tagIndex].text : ''),
    [showAll.tagIndex]
  );

  const selectionsList = useMemo(() => {
    return ['accounts', 'languages', 'tags'].reduce((acc, category) => {
      Object.keys(selections[category].selected).forEach(key => {
        if (!selections[category].selected[key]) return;
        if (category === 'tags') {
          Object.keys(selections[category].selected[key]).forEach(tagIndex => {
            if (!selections[category].selected[key][tagIndex]) return;
            acc.push(
              <Badge>{`${filtered[category][key].text}: ${filtered[category][key].values[tagIndex].text}`}</Badge>
            );
          });
        } else {
          acc.push(<Badge>{filtered[category][key].text}</Badge>);
        }
      });
      return acc;
    }, []);
  }, [selections]);

  return (
    <>
      <div className="filters">
        <div className="header">
          <div className="top-bar">
            <div className="counter">
              <div
                className={`count ${
                  !filteredGuids.length ||
                  filteredGuids.length > filtered.maxEntities
                    ? 'bad'
                    : 'good'
                }`}
              >
                {filteredGuids.length}
              </div>
              <div className="hint">apps filtered</div>
              <div className="operator-selection">
                <Switch
                  label="Filter apps to match all categories"
                  info="Only shows apps that match all selected categories (accounts, languages and tags) below"
                  checked={isAndOperator}
                  onChange={({ target: { checked } = {} } = {}) =>
                    setIsAndOperator(checked)
                  }
                />
              </div>
            </div>
            <div className="action">
              <Button
                type={Button.TYPE.TERTIARY}
                sizeType={Button.SIZE_TYPE.LARGE}
                disabled={
                  !filteredGuids.length ||
                  filteredGuids.length > filtered.maxEntities
                }
                onClick={viewAppsHandler}
              >
                View apps
              </Button>
              {filtered.guids.length <= filtered.maxEntities ||
              filtered.allGuids.length <= filtered.maxEntities ? (
                <a onClick={closeHandler}>Close</a>
              ) : null}
            </div>
          </div>
          <div className="selections-list">{selectionsList}</div>
          <div className="message">
            <SectionMessage description={messageText} />
          </div>
        </div>
        <div className="content">
          <div className="category">
            <div className="title">Accounts</div>
            {accountsSelections.initial}
          </div>
          <div className="category">
            <div className="title">Languages</div>
            {languagesSelections.initial}
          </div>
          <div className="category">
            <div className="title">Tags</div>
            {tagSelections.initial}
          </div>
        </div>
      </div>
      <Modal hidden={showAll.modalHidden} onClose={hideModal}>
        <div className="modal-container">
          <div className="modal-content">
            <div className="title">
              Showing all{' '}
              {showAll.type === 'accounts' ? (
                <span className="values-for">accounts</span>
              ) : (
                <>
                  values for{' '}
                  <span className="values-for">{selectedTagText}</span> tag
                </>
              )}
            </div>
            <div className="filter">
              <div className="tf-icon">
                <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__SEARCH} />
              </div>
              <input
                placeholder="Search..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={filterText}
                onChange={({ target: { value = '' } = {} } = {}) =>
                  setFilterText(value)
                }
                style={{ backgroundColor: '#fff' }}
              />
            </div>
            <div className="values">
              {showAll.type === 'accounts'
                ? accountsSelections.all
                : tagSelections.all[showAll.tagIndex]}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

Filter.propTypes = {
  filtered: PropTypes.object,
  selections: PropTypes.object,
  isAndOperator: PropTypes.bool,
  setSelections: PropTypes.func,
  setIsAndOperator: PropTypes.func,
  updateFilteredGuids: PropTypes.func,
  setShowFilters: PropTypes.func
};

export default Filter;
