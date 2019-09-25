const ACCOUNT_NG_QUERY = `query {
    actor {
        accounts {
            id
            name
        }
        entitySearch(queryBuilder: {domain: APM, type: APPLICATION, reporting: true}) {
            results {
                entities {
                    account {
                        id
                        name
                    }
                    name
                    ... on ApmApplicationEntityOutline {
                        applicationId
                        name
                        language
                        runningAgentVersions {
                            maxVersion
                            minVersion
                        }
                        tags {
                            key
                            values
                        }
                        guid
                    }
                }
                nextCursor
            }
        }
    }
    docs {
        ruby: agentReleases(agentName: RUBY) {
          date
          version
        }
        java: agentReleases(agentName: JAVA) {
          date
          version
        }
        go: agentReleases(agentName: GO) {
          date
          version
        }
        php: agentReleases(agentName: PHP) {
          date
          version
        }
        python: agentReleases(agentName: PYTHON) {
          date
          version
        }
        dotnet: agentReleases(agentName: DOTNET) {
          date
          version
        }
        nodejs: agentReleases(agentName: NODEJS) {
          date
          version
        }
        sdk: agentReleases(agentName: SDK) {
          date
          version
        }
        elixir: agentReleases(agentName: ELIXIR) {
          date
          version
        }
    }
}`;

const ENTITY_NG_QUERY = `
query($queryCursor: String!) {
    actor {
        entitySearch(queryBuilder: {domain: APM, type: APPLICATION, reporting: true}) {
            results(cursor: $queryCursor) {
                entities {
                    account {
                        id
                        name
                    }
                    name
                    ... on ApmApplicationEntityOutline {
                        applicationId
                        name
                        language
                        runningAgentVersions {
                            maxVersion
                            minVersion
                        }
                        tags {
                            key
                            values
                        }
                        guid
                    }
                }
                nextCursor
            }
        }
    }
}
`;

export { ACCOUNT_NG_QUERY, ENTITY_NG_QUERY };
