import React from 'react';
import PropTypes from 'prop-types';

import { BlockText, Button } from 'nr1';
import DTIEInstructions from './DTIEInstructions';

const DTIESplash = ({ closeHandler, cancelHandler }) => {
  return (
    <div className="listing splash">
      <BlockText>
        The <strong>DT ingest estimator</strong> is used to estimate the amount
        of data ingested per month if Distributed Tracing was enabled for one or
        more applications.
      </BlockText>
      <BlockText>
        <strong>How is the estimate derived?</strong>
      </BlockText>
      <BlockText>
        The estimate is derived from a model developed by New Relic using
        statistical modelling techniques. The model first estimates the expected
        number of Distributed Tracing span events seen per application based on
        the applications web transaction volumes on the chosen day. It then
        applies the default language agents span limit per agent instance to cap
        the number of spans sent to New Relic per minute per instance. The
        chosen days per minute web transaction pattern determine how frequent
        these caps are applied over the 1,440 minutes analyzed. The sum of span
        events sent on a per minute basis is then multiplied by the size of a
        span event. The size of a span event is another model coefficient that
        varies by language agent. In addition, each model coefficient is
        represented by the 50th, 70th and 90th percentiles to accomodate
        variance in the population sample used to derive the model. Once a daily
        estimate is derived this is multiplied by 30 to produce the monthly
        estimate.
      </BlockText>
      <BlockText>
        <strong>To use the estimator:</strong>
      </BlockText>
      <BlockText>
        <DTIEInstructions />
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
          <li>
            The estimator uses web transactions to derive the estimate. If the
            application is not emitting web transaction the estimate will return
            zero values. We hope to add support for non-web transactions in a
            future version.
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

DTIESplash.propTypes = {
  closeHandler: PropTypes.func,
  cancelHandler: PropTypes.func
};

export default DTIESplash;
