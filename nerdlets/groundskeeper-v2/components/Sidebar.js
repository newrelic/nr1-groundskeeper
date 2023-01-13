import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon, SectionMessage } from 'nr1';

const MAX_ENTITIES_CAN_FETCH = 1000;
const MAX_SIDEBAR_SECTION_ITEMS = 10;

const Sidebar = ({ sidebarItems, onSelect }) => {
  const [selection, setSelection] = useState(-1);
  const [filterText, setFilterText] = useState('');
  const [tagsTexts, setTagsTexts] = useState({});
  const [skipAcctLimit, setSkipAcctLimit] = useState(false);
  const [skipTagLimit, setSkipTagLimit] = useState(false);

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

  const otherItem = (item, index, viewAllLink) =>
    filterMatchTag(item) ? (
      <div className={item.type} key={index}>
        <div className="title">
          <span>{item.text}</span>
          {item.type === 'section' ? viewAllLink : null}
        </div>
      </div>
    ) : null;

  const sidebarItemsArr = sidebarItems.reduce(
    (acc, item, index) => {
      if (item.type === 'section') {
        let link;
        if (item.text === 'Accounts') {
          acc.acctMax =
            item.count < MAX_SIDEBAR_SECTION_ITEMS
              ? item.count
              : MAX_SIDEBAR_SECTION_ITEMS;
          if (!filterText.trim() && item.count > acc.acctMax)
            link = (
              <a
                className="view-all"
                onClick={() => setSkipAcctLimit(sal => !sal)}
              >
                {skipAcctLimit ? `View ${acc.acctMax}` : 'View all'}
              </a>
            );
        } else if (item.text === 'Tags') {
          acc.tagMax =
            item.count < MAX_SIDEBAR_SECTION_ITEMS
              ? item.count
              : MAX_SIDEBAR_SECTION_ITEMS;
          if (!filterText.trim() && item.count > acc.tagMax)
            link = (
              <a
                className="view-all"
                onClick={() => setSkipTagLimit(stl => !stl)}
              >
                {skipTagLimit ? `View ${acc.tagMax}` : 'View all'}
              </a>
            );
        }
        acc.ay.push(otherItem(item, index, link));
      } else if (item.account) {
        if (filterText.trim() || skipAcctLimit || acc.acctCounter < acc.acctMax)
          acc.ay.push(buttonItem(item, index));
        acc.acctCounter++;
      } else if (item.type === 'tag') {
        if (filterText.trim() || skipTagLimit || acc.tagCounter < acc.tagMax)
          acc.ay.push(otherItem(item, index));
        acc.tagCounter++;
      } else if (item.type === 'button') {
        if (
          filterText.trim() ||
          !('tagIndex' in item) ||
          skipTagLimit ||
          acc.tagCounter <= acc.tagMax
        )
          acc.ay.push(buttonItem(item, index));
      } else {
        acc.ay.push(otherItem(item, index));
      }
      return acc;
    },
    { ay: [], acctCounter: 0, acctMax: 0, tagCounter: 0, tagMax: 0 }
  );

  return (
    <div className="sidebar">
      <div className="message filter-limit">
        <SectionMessage description="Filters with over a 1000 entities are currently disabled." />
      </div>
      <div className="filter">
        <div className="tf-icon">
          <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__SEARCH} />
        </div>
        <input
          placeholder="Search filters"
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

      {sidebarItemsArr.ay}
    </div>
  );
};

Sidebar.propTypes = {
  sidebarItems: PropTypes.array,
  onSelect: PropTypes.func
};

export default Sidebar;
