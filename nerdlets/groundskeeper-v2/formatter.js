const numFormatter = new Intl.NumberFormat('default', {
  maximumFractionDigits: 2
});

const dateFieldFormatter = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const monthYearFormatter = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'long'
});

const formatInGB = num => (num ? `${numFormatter.format(num)} GB` : '');

const monthlyGB = num => (num ? `${formatInGB(num * 30)}/month` : '');

const formattedDateField = dt =>
  dt && dt instanceof Date ? dateFieldFormatter.format(dt) : '';

const formattedMonthYear = dt =>
  dt && dt instanceof Date ? monthYearFormatter.format(dt) : '';

export { formatInGB, monthlyGB, formattedDateField, formattedMonthYear };
