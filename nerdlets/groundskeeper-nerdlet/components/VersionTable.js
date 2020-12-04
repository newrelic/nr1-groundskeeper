import React from 'react';
import PropTypes from 'prop-types';

import { GridItem } from 'nr1';
import AgentVersion from './AgentVersion';
import InfraAgentVersion from './InfraAgentVersion';

function VersionTableGridItem({ agentVersions, freshAgentVersions }) {
  return (
    <GridItem columnSpan={3} className="secondary-table-grid-item">
      <AgentVersion
        agentVersions={agentVersions}
        freshAgentVersions={freshAgentVersions}
      />
      <InfraAgentVersion
        agentVersions={agentVersions}
        freshAgentVersions={freshAgentVersions}
      />
    </GridItem>
  );
}

VersionTableGridItem.propTypes = {
  agentVersions: PropTypes.object,
  freshAgentVersions: PropTypes.object
};

export default VersionTableGridItem;
