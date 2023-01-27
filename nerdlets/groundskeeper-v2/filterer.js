import React from 'react';

const links = (options, initialCount = 2, onClick, selected, onShowAll) => {
  let all;
  const checks = options
    .map((o, i) => ({ ...o, selected: selected[i], onClick }))
    .map(mapToLinks);
  if (checks.length <= initialCount)
    return {
      initial: checks,
      all
    };
  const initial = checks.slice(
    0,
    checks.length >= initialCount ? initialCount - 1 : initialCount
  );
  initial.push(
    <div className="val show-all" onClick={onShowAll}>
      <div className="btn">
        <span className="text">Show all</span>
      </div>
    </div>
  );
  return {
    initial,
    all: checks
  };
};

const listTags = (tags = [], initialCount, onClick, selected, onShowAll) =>
  tags.reduce(
    (acc, tag, index) => {
      const tagLinks = links(
        tag.values,
        initialCount,
        tagIndex => onClick(index, tagIndex),
        selected[index] || {},
        () => onShowAll(index)
      );
      acc.initial.push(
        <div className="tag" key={index}>
          <div className="title">{tag.text}</div>
          {tagLinks.initial}
        </div>
      );
      acc.all.push(tagLinks.all);
      return acc;
    },
    { initial: [], all: [] }
  );

const mapToLinks = ({ text, guids = [], selected = false, onClick }, index) => (
  <div
    className={`val ${selected ? 'selected' : ''}`}
    onClick={() => onClick(index)}
    key={index}
  >
    <div className="btn">
      <span className="text">{text}</span>
      <span className="count">({guids.length})</span>
    </div>
  </div>
);

export { links, listTags };
