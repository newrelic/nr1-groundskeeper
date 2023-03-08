import React from 'react';
import PropTypes from 'prop-types';

import {
  BlockText,
  Button,
  Card,
  CardBody,
  Icon,
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverTrigger
} from 'nr1';

import DTIEInstructions from './DTIEInstructions';

const DTIEHelpPopover = ({ onShowMore }) => {
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
        <PopoverFooter className="help-footer">
          <Button
            type={Button.TYPE.PLAIN}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__MORE}
            onClick={onShowMore}
          >
            Show more
          </Button>
        </PopoverFooter>
      </PopoverBody>
    </Popover>
  );
};

DTIEHelpPopover.propTypes = {
  onShowMore: PropTypes.func
};

export default DTIEHelpPopover;
