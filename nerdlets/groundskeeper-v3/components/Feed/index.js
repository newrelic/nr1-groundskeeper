// Copied from nr-labs-observability-pages (src/viz/feed.js) for now; DEPS-2 moves
// it into @newrelic/nr-labs-components and deletes this copy.
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// A feed of what happened, newest first (or in the order given): each entry
// has a time, a title, some text, a small label above the title (a
// version, a provider), a colored tag, and maybe a link. Chips above it
// filter by tag. It only needs React, so other apps can use it as it is
// (with feed.scss for its styles): give it `entries`, and that's all.

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const CLOCK_FORMAT = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

const isTime = ms => typeof ms === 'number' && Number.isFinite(ms);

// The date and the time of day apart, so a narrow feed breaks between
// them, not inside either.
function DefaultWhen({ time }) {
  const at = new Date(time);
  return (
    <>
      <span className="viz-feed__date">{DATE_FORMAT.format(at)}</span>{' '}
      <span className="viz-feed__clock">{CLOCK_FORMAT.format(at)}</span>
    </>
  );
}

DefaultWhen.propTypes = { time: PropTypes.number.isRequired };

const ALL = '\u0000all';

// The tags in the entries, in the order they first appear, with how many
// entries have each and the first one's color.
export function feedTags(entries) {
  const out = new Map();
  entries.forEach(e => {
    if (e.tag == null || e.tag === '') return;
    const key = String(e.tag);
    const seen = out.get(key);
    if (seen) seen.count += 1;
    else out.set(key, { tag: key, count: 1, color: e.color || null });
  });
  return [...out.values()];
}

const dotStyle = color => (color ? { background: color } : undefined);

function Chips({ tags, total, picked, onPick }) {
  const chip = (key, label, count, color) => (
    <button
      key={key}
      type="button"
      className={`u-unstyledButton viz-feed__chip${
        picked === key ? ' viz-feed__chip--on' : ''
      }`}
      aria-pressed={picked === key}
      onClick={() => onPick(key)}
    >
      {color !== undefined && (
        <span className="viz-feed__chip-dot" style={dotStyle(color)} />
      )}
      {label}
      <span className="viz-feed__chip-count">{count}</span>
    </button>
  );
  return (
    <div className="viz-feed__chips" role="group" aria-label="Show">
      {chip(ALL, 'All', total)}
      {tags.map(t => chip(t.tag, t.tag, t.count, t.color))}
    </div>
  );
}

Chips.propTypes = {
  tags: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  picked: PropTypes.string.isRequired,
  onPick: PropTypes.func.isRequired
};

function Entry({ entry, formatTime, onClick }) {
  let when = null;
  if (isTime(entry.time)) {
    when = formatTime ? (
      formatTime(entry.time)
    ) : (
      <DefaultWhen time={entry.time} />
    );
  }
  const tagged = entry.tag != null && entry.tag !== '';
  // One line, wrapping when narrow: the label, the time and the tag.
  const meta = (entry.label || when || tagged) && (
    <div className="viz-feed__meta">
      {entry.label && <span className="viz-feed__label">{entry.label}</span>}
      {when && (
        <time
          className="viz-feed__time"
          dateTime={new Date(entry.time).toISOString()}
        >
          {when}
        </time>
      )}
      {tagged && (
        <span className="viz-feed__tag">
          <span className="viz-feed__chip-dot" style={dotStyle(entry.color)} />
          {String(entry.tag)}
        </span>
      )}
    </div>
  );
  const title = entry.href ? (
    <a
      className="viz-feed__title"
      href={entry.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
    >
      {entry.title}
    </a>
  ) : (
    <span className="viz-feed__title">{entry.title}</span>
  );
  const clickable = !!onClick;
  return (
    <li
      className={`viz-feed__entry${
        clickable ? ' viz-feed__entry--clickable' : ''
      }`}
      onClick={clickable ? () => onClick(entry) : undefined}
      onKeyDown={
        clickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(entry);
              }
            }
          : undefined
      }
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="viz-feed__rail" aria-hidden="true">
        <span className="viz-feed__dot" style={dotStyle(entry.color)} />
      </span>
      <div className="viz-feed__body">
        {meta}
        {title}
        {entry.text && <p className="viz-feed__text">{entry.text}</p>}
      </div>
    </li>
  );
}

Entry.propTypes = {
  entry: PropTypes.object.isRequired,
  formatTime: PropTypes.func,
  onClick: PropTypes.func
};

export default function Feed({
  entries,
  chips,
  tag,
  onTagChange,
  formatTime,
  empty,
  onEntryClick,
  className
}) {
  const [own, setOwn] = useState(ALL);
  const controlled = tag !== undefined;
  const tags = useMemo(() => feedTags(entries), [entries]);
  let picked = own;
  if (controlled) picked = tag === null ? ALL : String(tag);
  // A tag that's gone (the data changed) shows everything.
  if (picked !== ALL && !tags.some(t => t.tag === picked)) picked = ALL;
  const pick = key => {
    if (!controlled) setOwn(key);
    if (onTagChange) onTagChange(key === ALL ? null : key);
  };
  const shown =
    picked === ALL
      ? entries
      : entries.filter(e => e.tag != null && String(e.tag) === picked);
  const showChips = chips && tags.length > 0;
  return (
    <div className={`viz-feed${className ? ` ${className}` : ''}`}>
      {showChips && (
        <Chips
          tags={tags}
          total={entries.length}
          picked={picked}
          onPick={pick}
        />
      )}
      {shown.length ? (
        <ol className="viz-feed__list">
          {shown.map((e, i) => (
            <Entry
              key={e.key != null ? e.key : i}
              entry={e}
              formatTime={formatTime}
              onClick={onEntryClick}
            />
          ))}
        </ol>
      ) : (
        <p className="viz-feed__empty">{empty}</p>
      )}
    </div>
  );
}

Feed.propTypes = {
  // [{ key?, time (ms)?, title, text?, label?, tag?, color? (CSS), href? }]
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  // Chips above the entries, to show one tag's entries.
  chips: PropTypes.bool,
  // The tag shown (null for all), when the app keeps it; else the feed does.
  tag: PropTypes.string,
  onTagChange: PropTypes.func,
  // A time as text; by default, the date and the time of day.
  formatTime: PropTypes.func,
  empty: PropTypes.node,
  onEntryClick: PropTypes.func,
  className: PropTypes.string
};

Feed.defaultProps = {
  chips: true,
  tag: undefined,
  onTagChange: null,
  formatTime: null,
  empty: 'Nothing to show.',
  onEntryClick: null,
  className: ''
};
