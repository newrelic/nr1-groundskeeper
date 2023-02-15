import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Button, InlineMessage, Modal, Switch } from 'nr1';
import { checks, listTags } from '../filterer';
import AllOptionsList from './AllOptionsList';
import Tag from './Tag';

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
  const [showAll, setShowAll] = useState({
    modalHidden: true,
    type: null,
    tagIndex: -1
  });
  const [startupState, setStartupState] = useState({});

  const accountsSelections = useMemo(
    () =>
      checks(
        filtered.accounts,
        7,
        index => checkHandler('accounts', index),
        selections.accounts.selected,
        () => showAllHandler('accounts')
      ),
    [filtered.accounts, selections.accounts.counter]
  );

  const languagesSelections = useMemo(
    () =>
      checks(
        filtered.languages,
        7,
        index => checkHandler('languages', index),
        selections.languages.selected
      ),
    [filtered.languages, selections.languages.counter]
  );

  const tagSelections = useMemo(
    () =>
      listTags(
        filtered.tags,
        3,
        (index, tagIndex) => checkHandler('tags', index, tagIndex),
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

  const checkHandler = useCallback((type, index, tagIndex) => {
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
  });

  const viewAppsHandler = useCallback(() => {
    updateFilteredGuids(filteredGuids);
  }, [filteredGuids]);

  const closeHandler = useCallback(() => {
    const { selections, isAndOperator } = startupState;
    setSelections(selections);
    setIsAndOperator(isAndOperator);
    setShowFilters(false);
  }, [startupState]);

  const hideModal = useCallback(() => {
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
              <Tag
                value={`${filtered[category][key].text}: ${filtered[category][key].values[tagIndex].text}`}
                onRemove={() => checkHandler(category, key, tagIndex)}
              />
            );
          });
        } else {
          acc.push(
            <Tag
              value={filtered[category][key].text}
              onRemove={() => checkHandler(category, key)}
            />
          );
        }
      });
      return acc;
    }, []);
  }, [selections]);

  const colorClassByCompare = useCallback((comparator1, comparator2) => {
    if (!comparator1) return '';
    return comparator1 > comparator2 ? 'bad' : 'good';
  });

  return (
    <>
      <div className="filters">
        <div className="header">
          <div className="meta-bar">
            <div className="message">
              <InlineMessage label={messageText} />
            </div>
            <div className="close">
              <Button
                iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CLOSE}
                type={Button.TYPE.PLAIN}
                sizeType={Button.SIZE_TYPE.SMALL}
                onClick={closeHandler}
              />
            </div>
          </div>
          <div className="top-bar">
            <div className="counter">
              <div
                className={`count ${colorClassByCompare(
                  filteredGuids.length,
                  filtered.maxEntities
                )}`}
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
            </div>
          </div>
          <div className="selections-list">{selectionsList}</div>
        </div>
        <div className="content">
          <div className="columns">
            <div className="column">
              <div className="title">Accounts</div>
              {accountsSelections.initial}
            </div>
            <div className="column">
              <div className="title">Languages</div>
              {languagesSelections.initial}
            </div>
          </div>
          <div className="category">
            <div className="title">Tags</div>
            {tagSelections.initial}
          </div>
        </div>
      </div>
      <Modal hidden={showAll.modalHidden} onClose={hideModal}>
        {!showAll.modalHidden ? (
          <AllOptionsList
            optionsFor={showAll.type === 'accounts' ? '' : selectedTagText}
            optionsList={
              showAll.type === 'accounts'
                ? accountsSelections.all
                : tagSelections.all[showAll.tagIndex]
            }
            filterText={null}
            setFilterText={null}
          />
        ) : null}
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
