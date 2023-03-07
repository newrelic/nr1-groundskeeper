import React from 'react';

import {
  BlockText,
  Card,
  CardBody,
  Icon,
  Popover,
  PopoverBody,
  PopoverTrigger
} from 'nr1';

import DTIEInstructions from './DTIEInstructions';

const DTIEHelpPopover = () => {
  return (
    <Popover openOnHover>
      <PopoverTrigger>
        <BlockText>
          <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
          Instructions
        </BlockText>
      </PopoverTrigger>
      <PopoverBody>
        <Card className="help-card">
          <CardBody>
            <BlockText>
              <DTIEInstructions />
            </BlockText>
          </CardBody>
        </Card>
      </PopoverBody>
    </Popover>
  );
};

export default DTIEHelpPopover;
