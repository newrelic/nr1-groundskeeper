import React from 'react';

import { navigation, SectionMessage } from 'nr1';

const Redirector = () => {
  const v1nerdletLocation = navigation.getReplaceNerdletLocation({
    id: 'groundskeeper-router',
    urlState: {
      toNerdletId: 'groundskeeper-nerdlet'
    }
  });

  return (
    <div
      className="redirector"
      style={{ paddingBottom: '8px', backgroundColor: '#f3f4f4' }}
    >
      <SectionMessage
        description="Prefer the original version of Agent Groundskeeper?"
        actions={[{ label: 'Switch to v1', to: v1nerdletLocation }]}
      />
    </div>
  );
};

export default Redirector;
