import React, { useState } from 'react';

const MAX_ENTITIES_FETCHED = 100;

const Sidebar = ({ sidebarItems, onChange }) => {
  const [selection, setSelection] = useState(-1);

  const clickHandler = index => {
    setSelection(index);
    if (onChange) onChange(sidebarItems[index], index);
  };

  const isDisabled = item => item.count > MAX_ENTITIES_FETCHED;

  const buttonItem = (item, index) => (
    <div
      className={`link ${selection === index ? 'selected' : ''} ${
        isDisabled(item) ? 'disabled' : ''
      }`}
      onClick={() => (!isDisabled(item) ? clickHandler(index) : null)}
    >
      <div className="btn">
        <span className="text">{item.text}</span>
        <span className="count">({item.count})</span>
      </div>
    </div>
  );

  const otherItem = (item, index) => (
    <div className={item.type}>
      <div className="title">
        <span>{item.text}</span>
      </div>
    </div>
  );

  return (
    <div className="sidebar">
      {sidebarItems.map(({ type }, index) =>
        type === 'button'
          ? buttonItem(sidebarItems[index], index)
          : otherItem(sidebarItems[index], index)
      )}
    </div>
  );
};

export default Sidebar;
