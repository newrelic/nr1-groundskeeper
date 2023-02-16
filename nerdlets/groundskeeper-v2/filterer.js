import React from 'react';

import { Checkbox } from 'nr1';

const checks = (options, initialCount = 2, onClick, selected, onShowAll) => {
  let all;
  const checks = options
    .map((o, i) => ({ ...o, selected: selected[i], onClick }))
    .map(mapToCheckboxes);
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
    <div className="check show-all" onClick={onShowAll}>
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
      const tagChecks = checks(
        tag.values,
        initialCount,
        tagIndex => onClick(index, tagIndex),
        selected[index] || {},
        () => onShowAll(index)
      );
      acc.initial.push(
        <div className="tag" key={index}>
          <div className="title">{tag.text}</div>
          {tagChecks.initial}
        </div>
      );
      acc.all.push(tagChecks.all);
      return acc;
    },
    { initial: [], all: [] }
  );

const mapToCheckboxes = (
  { text, guids = [], selected = false, onClick },
  index
) => (
  <div className="check" key={index}>
    <Checkbox checked={selected} onChange={() => onClick(index)} label={text} />
    <span className="count">({guids.length})</span>
  </div>
);

export { checks, listTags };
