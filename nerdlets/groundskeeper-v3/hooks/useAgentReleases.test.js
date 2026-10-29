import { useNerdGraphQuery } from 'nr1';

import useAgentReleases from './useAgentReleases';
import { renderHook } from './testUtils';

describe('useAgentReleases', () => {
  beforeEach(() => {
    useNerdGraphQuery.mockReset();
  });

  test('returns an empty object before data has loaded', () => {
    useNerdGraphQuery.mockReturnValue({ data: undefined, loading: true });

    const { result } = renderHook(useAgentReleases);

    expect(result.current.releases).toEqual({});
    expect(result.current.loading).toBe(true);
  });

  test('keys releases by language, then version, parsing dates to UTC midnight', () => {
    useNerdGraphQuery.mockReturnValue({
      data: {
        docs: {
          java: [
            {
              version: '7.4.0',
              date: '2023-01-01',
              eolDate: null,
              features: 'x',
              security: false,
              bugs: 'bug-x',
              slug:
                'docs/release-notes/agent-release-notes/java-release-notes/java-agent-740'
            },
            {
              version: '8.21.1',
              date: '2024-06-01',
              eolDate: '2025-06-01',
              features: 'y',
              security: true,
              bugs: 'bug-y',
              slug:
                'docs/release-notes/agent-release-notes/java-release-notes/java-agent-8211'
            }
          ]
        }
      }
    });

    const { result } = renderHook(useAgentReleases);

    expect(result.current.releases.java['7.4.0']).toEqual({
      date: new Date('2023-01-01T00:00:00Z'),
      eolDate: null,
      features: 'x',
      security: false,
      bugs: 'bug-x',
      slug:
        'docs/release-notes/agent-release-notes/java-release-notes/java-agent-740'
    });
    expect(result.current.releases.java['8.21.1']).toEqual({
      date: new Date('2024-06-01T00:00:00Z'),
      eolDate: new Date('2025-06-01T00:00:00Z'),
      features: 'y',
      security: true,
      bugs: 'bug-y',
      slug:
        'docs/release-notes/agent-release-notes/java-release-notes/java-agent-8211'
    });
  });

  test('includes every known agent language, even with no releases returned', () => {
    useNerdGraphQuery.mockReturnValue({ data: { docs: { java: [] } } });

    const { result } = renderHook(useAgentReleases);

    expect(Object.keys(result.current.releases).sort()).toEqual(
      ['dotnet', 'go', 'java', 'nodejs', 'php', 'python', 'ruby'].sort()
    );
    expect(result.current.releases.dotnet).toEqual({});
  });
});
