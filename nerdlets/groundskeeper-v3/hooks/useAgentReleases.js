import { useMemo } from 'react';
import { useNerdGraphQuery } from 'nr1';
import { AGENTS } from '../constants';
import { AGENT_RELEASES } from '../queries';

// Release dates come back as bare `YYYY-MM-DD` strings; anchoring to UTC midnight
// avoids the date silently shifting a day depending on the browser's timezone.
const parseDate = dateStr =>
  dateStr ? new Date(`${dateStr}T00:00:00Z`) : null;

// Returns releases keyed by entity.language -> version -> { date, eolDate, features, security }.
// `eolDate` feeds utils/status.js's EOL check; `features`/`security` aren't used yet
// but are already fetched for the CVE-highlighting follow-up.
const useAgentReleases = () => {
  const { data, error, loading } = useNerdGraphQuery({ query: AGENT_RELEASES });

  const releases = useMemo(() => {
    if (!data?.docs) return {};
    return Object.values(AGENTS).reduce((acc, language) => {
      const byVersion = (data.docs[language] || []).reduce(
        (versions, { version, date, eolDate, features, security }) => ({
          ...versions,
          [version]: {
            date: parseDate(date),
            eolDate: parseDate(eolDate),
            features,
            security
          }
        }),
        {}
      );
      return { ...acc, [language]: byVersion };
    }, {});
  }, [data]);

  return { releases, error, loading };
};

export default useAgentReleases;
