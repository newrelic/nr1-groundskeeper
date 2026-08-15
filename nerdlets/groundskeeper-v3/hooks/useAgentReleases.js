import { useMemo } from 'react';
import { useNerdGraphQuery } from 'nr1';
import { AGENTS } from '../constants';
import { AGENT_RELEASES } from '../queries';

// Release dates come back as bare `YYYY-MM-DD` strings; anchoring to UTC midnight
// avoids the date silently shifting a day depending on the browser's timezone.
const parseDate = dateStr =>
  dateStr ? new Date(`${dateStr}T00:00:00Z`) : null;

// Returns releases keyed by entity.language -> version -> { date, eolDate, features, security, bugs, slug }.
// `eolDate` feeds utils/status.js's EOL check; `features`/`security`/`bugs` aren't used yet
// but are already fetched for the CVE-highlighting follow-up. `slug` is the docs-website
// path for the release note (see ~/Downloads/docs-callout.md) -- combine with
// docs.newrelic.com to build a link once that follow-up lands.
const useAgentReleases = () => {
  const { data, error, loading } = useNerdGraphQuery({ query: AGENT_RELEASES });

  const releases = useMemo(() => {
    if (!data?.docs) return {};
    return Object.values(AGENTS).reduce((acc, language) => {
      const byVersion = (data.docs[language] || []).reduce(
        (
          versions,
          { version, date, eolDate, features, security, bugs, slug }
        ) => ({
          ...versions,
          [version]: {
            date: parseDate(date),
            eolDate: parseDate(eolDate),
            features,
            security,
            bugs,
            slug
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
