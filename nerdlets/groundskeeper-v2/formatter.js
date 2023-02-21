const formatter = new Intl.NumberFormat('default', {
  maximumFractionDigits: 2
});

const formatInGB = num => (num ? `${formatter.format(num)} GB` : '');

const monthlyGB = num => (num ? `${formatInGB(num * 30)}/month` : '');

export { formatInGB, monthlyGB };
