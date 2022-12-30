import React from 'react';

import { Icon, Tooltip } from 'nr1';

const characteristics = {
  distributedTracing: {
    icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES,
    text: 'Distributed Tracing',
  },
  logs: {
    icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__LOGS,
    text: 'Logs',
  },
  infinteTracing: {
    icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__MONITORING,
    text: 'Infinte Tracing',
  }
};

const FeatureIcon = ({feature, enabled = false}) => {
  const { text, icon } = characteristics[feature];

  if (!feature || !icon) return null;
  
  return (
    <Tooltip text={`${text} ${enabled ? '' : 'not'} enabled`}>
      <Icon 
        type={icon}
        style={enabled ? null : {opacity: 0.1}} 
      />
    </Tooltip>
  );
}

export default FeatureIcon;
