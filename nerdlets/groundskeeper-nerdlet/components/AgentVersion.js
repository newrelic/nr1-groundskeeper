import React from 'react';
import PropTypes from 'prop-types';

export default class AgentVersion extends React.PureComponent {
  static propTypes = {
    agentVersions: PropTypes.object.isRequired,
    freshAgentVersions: PropTypes.object.isRequired,
  };

  render() {
    const { agentVersions, freshAgentVersions } = this.props;

    return (
      <div className="agent-versions">
        <h3>Latest APM agent versions</h3>
        <table>
          <tr>
            <th>Language</th>
            <th>Version</th>
            <th>Released on</th>
          </tr>
          <tbody>
            {Object.keys(freshAgentVersions)
              .sort()
              .map(lng => (
                <tr key={`lang-ver-${lng}`}>
                  <td>{lng}</td>
                  <td>{freshAgentVersions[lng][0]}</td>
                  <td>
                    {agentVersions[lng]
                      .find(v => v.version === freshAgentVersions[lng][0])
                      .date.format('MMM Do YYYY')}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }
}
