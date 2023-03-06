import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon, Popover, PopoverTrigger, PopoverBody, TextField } from 'nr1';

import { formattedDateField, formattedMonthYear } from '../formatter';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const firstDayOfMonth = d => new Date(d.yr, d.mo).getDay();

const lastDateInMonth = d => new Date(d.yr, d.mo + 1, 0).getDate();

const extractDateParts = d => ({
  yr: d.getFullYear(),
  mo: d.getMonth(),
  dt: d.getDate()
});

const afterToday = (cur, d) => {
  const today = new Date();
  return (
    cur.yr === today.getFullYear() &&
    cur.mo === today.getMonth() &&
    d > today.getDate()
  );
};

const selectedDate = (index, cur, dt) => {
  if (!dt || !(dt instanceof Date)) return false;
  return (
    dt.getFullYear() === cur.yr &&
    dt.getMonth() === cur.mo &&
    dt.getDate() === index + 1
  );
};

const DatePicker = ({ date, onChange }) => {
  const [opened, setOpened] = useState(false);
  const [current, setCurrent] = useState(extractDateParts(new Date()));

  useEffect(() => {
    if (!date || !(date instanceof Date)) return;
    setCurrent(extractDateParts(date));
  }, [date]);

  const textValue = useMemo(() => formattedDateField(date), [date]);

  const blankCells = useMemo(
    () =>
      Array.from({ length: firstDayOfMonth(current) }, () => (
        <div className="cell" />
      )),
    [current]
  );

  const dateCells = useMemo(
    () =>
      Array.from({ length: lastDateInMonth(current) }, (_, i) => (
        <div
          className={`cell date ${
            selectedDate(i, current, date) ? 'selected' : ''
          } ${afterToday(current, i + 1) ? 'disabled' : ''}`}
          onClick={() => clickHandler(i)}
        >
          {i + 1}
        </div>
      )),
    [current]
  );

  const monthYear = useMemo(
    () => formattedMonthYear(new Date(current.yr, current.mo)),
    [current]
  );

  const prevMonth = useCallback(() => {
    const pMo = new Date(current.yr, current.mo - 1);
    setCurrent(extractDateParts(pMo));
  });

  const nextMonth = useCallback(() => {
    const nMo = new Date(current.yr, current.mo + 1);
    if (nMo > new Date()) return;
    setCurrent(extractDateParts(nMo));
  });

  const clickHandler = useCallback(dt => {
    if (
      selectedDate(dt, current, date) ||
      afterToday(current, dt + 1) ||
      !onChange
    )
      return;
    onChange(new Date(current.yr, current.mo, dt + 1));
    setOpened(false);
  });

  const changeHandler = useCallback((_, o) => setOpened(o));

  return (
    <Popover opened={opened} onChange={changeHandler}>
      <PopoverTrigger>
        <TextField
          className="date-picker-text-field"
          value={textValue}
          placeholder="Select a date"
          readOnly
        />
      </PopoverTrigger>
      <PopoverBody>
        <div className="date-picker">
          <div className="cell prev" onClick={prevMonth}>
            <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_LEFT} />
          </div>
          <div className="cell mo-yr">{monthYear}</div>
          <div className="cell next" onClick={nextMonth}>
            <Icon type={Icon.TYPE.INTERFACE__CHEVRON__CHEVRON_RIGHT} />
          </div>
          {DAYS.map(day => (
            <div className="cell day" key={day}>
              <abbr title={day}>{day.substring(0, 3)}</abbr>
            </div>
          ))}
          {blankCells}
          {dateCells}
        </div>
      </PopoverBody>
    </Popover>
  );
};

DatePicker.propTypes = {
  date: PropTypes.instanceOf(Date),
  onChange: PropTypes.func
};

export default DatePicker;
