import { ngql } from 'nr1';
import { AGENTS } from '../constants';

// Mirrors groundskeeper-v2/queries.js AGENT_RELEASES, extended with eolDate/features/security
// so utils/status.js can derive EOL and (eventually) CVE status, and with bugs/slug so a
// future release note link/callout can be built (see ~/Downloads/docs-callout.md for how
// slug maps to a docs.newrelic.com URL).
//
// The .map() below produces an array of strings; interpolating an array into a
// template literal joins it with commas, which is exactly what we want here since
// GraphQL treats commas between fields as insignificant whitespace.
const AGENT_RELEASES = ngql`
{
  docs {
    ${Object.keys(AGENTS).map(
      key => `
      ${AGENTS[key]}: agentReleases(agentName: ${key}) {
        bugs
        date
        eolDate
        features
        security
        slug
        version
      }
    `
    )}
  }
}
`;

export { AGENT_RELEASES };
