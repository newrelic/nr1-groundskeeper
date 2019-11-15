import { cleanAgentVersion, agentVersionInList, agentAge } from './helpers';

test('cleanAgentVersion strips `v` prefix', () => {
  expect(cleanAgentVersion('v4.3.2.1')).toBe('4.3.2');
  expect(cleanAgentVersion('4.5.0')).toBe('4.5.0');
});

// The tests in this case hover right around 80 char line length.
// Rather than having some tests wrap to multi-line, I'll disable checks.
// prettier-ignore
test('agentVersionInList matches on various permutations', () => {
  const freshAgentVersions = {
    java: ['5.8.0'],
    dotnet: ['6.8.7', '6.8.0', '6.7.0'],
  };

  expect(agentVersionInList('5.8.0.23', freshAgentVersions['java'])).toBe(true);
  expect(agentVersionInList('5.7.6', freshAgentVersions['java'])).toBe(false);

  expect(agentVersionInList('6.8.0.1', freshAgentVersions['dotnet'])).toBe(true);
  expect(agentVersionInList('6.8.0', freshAgentVersions['dotnet'])).toBe(true);
  expect(agentVersionInList('6.8.7.1', freshAgentVersions['dotnet'])).toBe(true);
  expect(agentVersionInList('6.8.7', freshAgentVersions['dotnet'])).toBe(true);
  expect(agentVersionInList('5.7.6', freshAgentVersions['dotnet'])).toBe(false);

});

// The tests in this case hover right around 80 char line length.
// Rather than having some tests wrap to multi-line, I'll disable checks.
// prettier-ignore
test('agentAge returns the correct age for various versions, and undefined', () => {
  // raw result subset from NerdGraph
  const agents = {
    'java': [
      {
        'date': '2019-10-29',
        'version': '5.8.0',
      },
      {
        'date': '2019-09-25',
        'version': '5.7.0',
      },
      {
        'date': '2019-09-17',
        'version': '5.6.0',
      },
      {
        'date': '2019-09-04',
        'version': '5.5.0',
      },
    ],
    'ruby': [
      {
        'date': '2019-10-01',
        'version': 'V6.7.0',
      },
      {
        'date': '2019-09-05',
        'version': '6.6.0.358',
      },
      {
        'date': '2019-06-26',
        'version': 'v6.5.0',
      },
      {
        'date': '2019-05-28',
        'version': 'v6.4.0',
      },
      {
        'date': '2019-04-30',
        'version': 'v6.3.0',
      },
      {
        'date': '2019-03-18',
        'version': 'v6.2.0',
      },
    ],
  };

  // replicate the clean-up behavior of our app's data fetcher
  Object.keys(agents).forEach(lang => {
    agents[lang].forEach(v => {
      v.version = cleanAgentVersion(v.version);
    });
  });

  expect(
    agentAge({ language: 'java', agentVersions: ['5.7.0.221'] }, agents)
  ).toBe('2019-09-25');
  expect(
    agentAge({ language: 'ruby', agentVersions: ['6.2.0'] }, agents)
  ).toBe('2019-03-18');
  expect(
    agentAge({ language: 'ruby', agentVersions: ['6.2.0.38'] }, agents)
  ).toBe('2019-03-18');
  expect(
    agentAge({ language: 'java', agentVersions: ['5.4.0'] }, agents)
  ).toBe(undefined);
});
