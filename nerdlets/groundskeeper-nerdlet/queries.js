const ACCOUNT_NG_QUERY = `query {
                                   actor {
                                       accounts {
                                           id
                                           name
                                       }
                                       apm: entitySearch(queryBuilder: {domain: APM, type: APPLICATION, reporting: true}) {
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
                                                       entityType
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
                                     infra: entitySearch(queryBuilder: {domain: INFRA, type: HOST, reporting: true}) {
                                                                  results {
                                                                      entities {
                                                                          account {
                                                                              id
                                                                              name
                                                                          }
                                                                          name
                                                                          ... on InfrastructureHostEntityOutline {
                                                                                     applicationId: name
                                                                                     appId: name
                                                                                     name
                                                                                     entityType
                                                                                     accountId
                                                                                     tags {
                                                                                       key
                                                                                       values
                                                                                     }
                                                                                     guid
                                                                                     permalink
                                                                          }
                                                                      }
                                                                      nextCursor
                                                          }
                                     }}
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
                                       infrastructure: agentReleases(agentName: INFRASTRUCTURE) {
                                          date
                                          version
                                        }
                                   }
                               }`;

const ENTITY_NG_QUERY = `
query($queryCursor: String!) {
    actor {
        apm: entitySearch(queryBuilder: {domain: APM, type: APPLICATION, reporting: true}) {
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
                        entityType
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
        infra: entitySearch(queryBuilder: {domain: INFRA, type: HOST, reporting: true}) {
                                                                  results(cursor: $queryCursor)  {
                                                                      entities {
                                                                          account {
                                                                              id
                                                                              name
                                                                          }
                                                                          name
                                                                          ... on InfrastructureHostEntityOutline {
                                                                                     applicationId: name
                                                                                     appId: name
                                                                                     name
                                                                                     entityType
                                                                                     accountId
                                                                                     tags {
                                                                                       key
                                                                                       values
                                                                                     }
                                                                                     guid
                                                                                     permalink
                                                                          }
                                                                      }
                                                                      nextCursor
                                                                  }
                                             }
    }
}
`;

const ENTITY_NG_QUERY_APM = `
query($queryCursor: String!) {
    actor {
        apm: entitySearch(queryBuilder: {domain: APM, type: APPLICATION, reporting: true}) {
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
                        entityType
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

const ENTITY_NG_QUERY_INFRA = `
query($queryCursor: String!) {
    actor {
        infra: entitySearch(queryBuilder: {domain: INFRA, type: HOST, reporting: true}) {
                                                                  results(cursor: $queryCursor)  {
                                                                      entities {
                                                                          account {
                                                                              id
                                                                              name
                                                                          }
                                                                          name
                                                                          ... on InfrastructureHostEntityOutline {
                                                                                     applicationId: name
                                                                                     appId: name
                                                                                     name
                                                                                     entityType
                                                                                     accountId
                                                                                     tags {
                                                                                       key
                                                                                       values
                                                                                     }
                                                                                     guid
                                                                                     permalink
                                                                          }
                                                                      }
                                                                      nextCursor
                                                                  }
                                             }
    }
}
`;

export {
  ACCOUNT_NG_QUERY,
  ENTITY_NG_QUERY,
  ENTITY_NG_QUERY_APM,
  ENTITY_NG_QUERY_INFRA
};
