import React, { useEffect, useState } from 'react';

import { Icon } from 'nr1';

const MAX_ENTITIES_CAN_FETCH = 100;

const Sidebar = ({ sidebarItems, onSelect }) => {
  const [selection, setSelection] = useState(-1);
  const [filterText, setFilterText] = useState('');
  const [tagsTexts, setTagsTexts] = useState({});

  useEffect(() => {
    setTagsTexts(
      sidebarItems.reduce((acc, item) => {
        if (!('tagIndex' in item)) return acc;
        const { tagIndex, type, text } = item;
        return type === 'tag'
          ? { ...acc, [tagIndex]: [text] }
          : { ...acc, [tagIndex]: [...acc[tagIndex], text] };
      }, {})
    );
  }, [sidebarItems]);

  const clickHandler = index => {
    setSelection(index);
    if (onSelect) onSelect(sidebarItems[index], index);
  };

  const isDisabled = item => item.count > MAX_ENTITIES_CAN_FETCH;

  const regexSafe = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const textMatchesFilter = (text = '') =>
    new RegExp(regexSafe(filterText), 'i').test(text);

  const filterMatchItem = ({ text, tagIndex } = {}) => {
    if (!filterText.trim()) return true;
    if (tagIndex || tagIndex === 0)
      return (
        textMatchesFilter(tagsTexts[tagIndex][0]) || textMatchesFilter(text)
      );
    return textMatchesFilter(text);
  };

  const filterMatchTag = ({ type = '', tagIndex } = {}) => {
    if (type !== 'tag' || !filterText.trim()) return true;
    return tagsTexts[tagIndex].some(txt => textMatchesFilter(txt));
  };

  const selectedClass = index => (selection === index ? 'selected' : '');

  const disabledClass = item => (isDisabled(item) ? 'disabled' : '');

  const buttonItem = (item, index) =>
    !index || filterMatchItem(item) ? (
      <div
        className={`link ${selectedClass(index)} ${disabledClass(item)}`}
        onClick={() => (!isDisabled(item) ? clickHandler(index) : null)}
        key={index}
      >
        <div className="btn">
          <span className="text">{item.text}</span>
          <span className="count">({item.count})</span>
        </div>
      </div>
    ) : null;

  const otherItem = (item, index) =>
    filterMatchTag(item) ? (
      <div className={item.type} key={index}>
        <div className="title">
          <span>{item.text}</span>
        </div>
      </div>
    ) : null;

  return (
    <div className="sidebar">
      <div className="filter">
        <div className="tf-icon">
          <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__FILTER} />
        </div>
        <input
          placeholder="Filter items"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          value={filterText}
          onChange={({ target: { value = '' } = {} } = {}) =>
            setFilterText(value)
          }
          style={{ backgroundColor: '#fff' }}
        />
      </div>

      {sidebarItems.map(({ type }, index) =>
        type === 'button'
          ? buttonItem(sidebarItems[index], index)
          : otherItem(sidebarItems[index], index)
      )}
    </div>
  );
};

export default Sidebar;
