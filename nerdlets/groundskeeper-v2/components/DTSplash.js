import React from 'react';
import PropTypes from 'prop-types';

import { BlockText, Button } from 'nr1';
import DTInstructions from './DTInstructions';

const DTSplash = ({ closeHandler, cancelHandler }) => {
  return (
    <div className="listing splash">
      <BlockText>
        The <strong>DT ingest estimator</strong> is used to estimate the amount
        of data ingested per month if Distributed Tracing was enabled for one or
        more applications.
      </BlockText>
      <BlockText>To use the estimator:</BlockText>
      <BlockText>
        <DTInstructions />
      </BlockText>
      <BlockText>
        The estimates are divided into moderate, high and very high. These
        represent the percentage of customers whose estimate may fall on or
        below the provided figure, given similar conditions. In the case of
        moderate this means 50% of customers are likely to produce the same or
        lower estimate. Conversely, very high means 90% of customers are likely
        to produce the same or lower estimate.
      </BlockText>
      <BlockText>
        For the majority of cases the moderate or high estimates should be used.
        If you have reason to believe your case is special use the very high
        estimate.
      </BlockText>
      <BlockText>
        <strong>Considerations</strong>
      </BlockText>
      <BlockText>
        <ul>
          <li>
            Estimates are calculated using the applications language,
            transaction pattern and volumes generated on the chosen day. The
            results from this day are used to extrapolate the estimate for a
            month. This makes the estimate sensitive to the chosen day. To avoid
            under and over estimation, it is important to choose a day that is
            neither the highest nor lowest transaction day of the month. It is
            best to choose a day that represents typical transaction patterns
            and volumes throughout the month.
          </li>
          <li>
            Estimates assume default settings will be used in the APM agent for
            Distributed Tracing and that a current version of the agent (as of
            Feb 2023) will be used. If the agents default span limits or harvest
            cycles are modified the estimates do not apply.
          </li>
          <li>
            Estimates only apply to Distributed Tracing used in New Relic APM
            agents.
          </li>
          <li>
            Estimates have a limited life and do not apply if the applications
            transaction pattern and volumes change.
          </li>
          <li>
            Estimates are subject to variance and corner cases and should only
            be used as a guide.
          </li>
        </ul>
      </BlockText>
      <BlockText>
        New Relic expressly disclaims the accuracy, adequacy, or completeness of
        any estimates and information provided in this application, and shall
        not be liable for any errors, omissions or other defects in this
        application, estimates and information provided, or for any actions
        taken in reliance thereon.
      </BlockText>
      <div className="controls">
        <Button
          type={Button.TYPE.PLAIN}
          sizeType={Button.SIZE_TYPE.SMALL}
          iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__SKIP_BACK}
          onClick={cancelHandler}
        >
          Back
        </Button>
        <Button
          type={Button.TYPE.PRIMARY}
          sizeType={Button.SIZE_TYPE.SMALL}
          onClick={closeHandler}
        >
          Get started
        </Button>
      </div>
    </div>
  );
};

DTSplash.propTypes = {
  closeHandler: PropTypes.func,
  cancelHandler: PropTypes.func
};

export default DTSplash;
