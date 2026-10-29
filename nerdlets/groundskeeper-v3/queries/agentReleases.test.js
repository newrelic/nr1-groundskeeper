import { AGENTS } from '../constants';
import { AGENT_RELEASES } from './agentReleases';

// Relies on __mocks__/nr1.js's `ngql` -- a template tag that just flattens back into
// a plain string, not a real GraphQL parser -- so this checks the composed query
// text rather than a parsed document.
describe('AGENT_RELEASES', () => {
  test('requests agentReleases for every known agent, aliased to its language', () => {
    Object.keys(AGENTS).forEach(key => {
      expect(AGENT_RELEASES).toContain(
        `${AGENTS[key]}: agentReleases(agentName: ${key})`
      );
    });
  });

  test('requests the fields status/EOL derivation depends on', () => {
    ['date', 'eolDate', 'features', 'security', 'version'].forEach(field => {
      expect(AGENT_RELEASES).toContain(field);
    });
  });

  test('requests bugs/slug for the upcoming release note link/callout', () => {
    ['bugs', 'slug'].forEach(field => {
      expect(AGENT_RELEASES).toContain(field);
    });
  });

  test('is nested under docs', () => {
    expect(AGENT_RELEASES).toMatch(/docs\s*{/);
  });
});
