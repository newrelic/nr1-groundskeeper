import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { Button, Toast } from 'nr1';

import useDTIngestEstimates from '../hooks/useDTIngestEstimates';
import { downloadDTIE } from '../csv';
import DatePicker from './DatePicker';
import DTIESplash from './DTIESplash';
import DTIEHelpPopover from './DTIEHelpPopover';
import DTIEFooter from './DTIEFooter';
import DTIETable from './DTIETable';
import { SELECT_APPS_TEXT, SELECT_DATE_TEXT } from './DTIEInstructions';

export const COLUMNS = {
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'veryHigh'
};

const toGigabytes = bytes => (bytes ? bytes / 1000000000 : 0);

const DTIngestEstimator = ({ entities, onClose, hideSplash, onHideSplash }) => {
  const [entityEstimates, setEntityEstimates] = useState({});
  const [selectedDate, setSelectedDate] = useState();
  const [selectedEntities, setSelectedEntities] = useState({});
  const [filteredEntities, setFilteredEntities] = useState([]);
  const { ingestEstimatesBytes, loading, error } = useDTIngestEstimates({
    entities: filteredEntities,
    selectedDate
  });
  const summaryCols = useRef({});
  const listingDiv = useRef();
  const headerDiv = useRef();

  useEffect(() => {
    if (!ingestEstimatesBytes || !Object.keys(ingestEstimatesBytes).length)
      return;
    setFilteredEntities([]);
    setEntityEstimates(ee => ({
      ...ee,
      ...Object.keys(ingestEstimatesBytes).reduce(
        (acc, guid) => ({
          ...acc,
          [guid]:
            ingestEstimatesBytes[guid].length === 3
              ? ingestEstimatesBytes[guid].map(b => toGigabytes(b))
              : [0, 0, 0]
        }),
        {}
      )
    }));
  }, [ingestEstimatesBytes]);

  useEffect(() => {
    if (!error) return;
    Toast.showToast({
      title: 'Error',
      description: 'There were error(s) retrieving the data.',
      type: Toast.TYPE.CRITICAL
    });
  }, [error]);

  const downloadHandler = useCallback(
    () =>
      downloadDTIE(
        entities
          .filter(({ guid }) => selectedEntities[guid])
          .map(({ guid, account, name, language }) => ({
            account,
            name,
            language,
            estimatesGigabytes:
              guid in entityEstimates ? entityEstimates[guid] : [0, 0, 0]
          }))
      ),
    [selectedEntities, entityEstimates]
  );

  const clickHandler = useCallback(() => {
    const style = {};
    if (listingDiv.current && headerDiv.current) {
      const { bottom: listingBottom = 0 } =
        listingDiv.current.getBoundingClientRect() || {};
      const { bottom: headerBottom = 0 } =
        headerDiv.current.getBoundingClientRect() || {};
      if (listingBottom && headerBottom) {
        style.marginBottom = listingBottom - headerBottom;
      }
    }

    if (
      !Object.keys(selectedEntities).filter(guid => selectedEntities[guid])
        .length
    ) {
      style.marginBottom = style.marginBottom - 100;
      Toast.showToast({
        description: SELECT_APPS_TEXT,
        style
      });
      return;
    }
    if (!(selectedDate && selectedDate instanceof Date)) {
      style.marginBottom = style.marginBottom - 180;
      Toast.showToast({
        description: SELECT_DATE_TEXT,
        style
      });
      return;
    }

    setFilteredEntities(
      entities.filter(
        ({ guid }) => !(guid in entityEstimates) && selectedEntities[guid]
      )
    );
  }, [selectedEntities, entityEstimates, selectedDate]);

  const dateChangeHandler = useCallback(dt => {
    setSelectedDate(dt);
    setEntityEstimates({});
  });

  const summary = useMemo(
    () =>
      entities.reduce(
        (acc, { guid }) => {
          if (selectedEntities[guid]) {
            acc.count = acc.count + 1;
            acc[COLUMNS.MODERATE] =
              acc[COLUMNS.MODERATE] + ((entityEstimates[guid] || [])[0] || 0);
            acc[COLUMNS.HIGH] =
              acc[COLUMNS.HIGH] + ((entityEstimates[guid] || [])[1] || 0);
            acc[COLUMNS.VERY_HIGH] =
              acc[COLUMNS.VERY_HIGH] + ((entityEstimates[guid] || [])[2] || 0);
          }
          return acc;
        },
        {
          count: 0,
          [COLUMNS.MODERATE]: 0,
          [COLUMNS.HIGH]: 0,
          [COLUMNS.VERY_HIGH]: 0
        }
      ),
    [entities, selectedEntities, entityEstimates, selectedDate]
  );

  if (!hideSplash)
    return <DTIESplash closeHandler={onHideSplash} cancelHandler={onClose} />;

  return (
    <div className="listing" ref={listingDiv}>
      <div className="header" ref={headerDiv}>
        <div className="col">
          <Button
            type={Button.TYPE.PLAIN}
            sizeType={Button.SIZE_TYPE.SMALL}
            iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__SKIP_BACK}
            onClick={onClose}
          >
            Back
          </Button>
        </div>
        <div className="col right">
          <span className="help">
            <DTIEHelpPopover />
          </span>
        </div>
        <div className="col">
          <div className="group-fields">
            <DatePicker date={selectedDate} onChange={dateChangeHandler} />
            <Button
              type={Button.TYPE.PRIMARY}
              sizeType={Button.SIZE_TYPE.SMALL}
              iconType={
                Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__TRACES
              }
              loading={loading}
              onClick={clickHandler}
            >
              Calculate DT ingest estimates
            </Button>
          </div>
        </div>
        <div className="col">
          <Button
            type={Button.TYPE.SECONDARY}
            sizeType={Button.SIZE_TYPE.SMALL}
            loading={loading}
            disabled={
              !Object.keys(ingestEstimatesBytes).length ||
              !Object.keys(selectedEntities).filter(e => selectedEntities[e])
                .length
            }
            onClick={downloadHandler}
          >
            Download
          </Button>
        </div>
      </div>
      <div className="content has-footer">
        <DTIETable
          entities={entities}
          selectedEntities={selectedEntities}
          setSelectedEntities={setSelectedEntities}
          entityEstimates={entityEstimates}
          summaryCols={summaryCols}
        />
      </div>
      <DTIEFooter summary={summary} summaryCols={summaryCols} />
    </div>
  );
};

DTIngestEstimator.propTypes = {
  entities: PropTypes.array,
  onClose: PropTypes.func,
  hideSplash: PropTypes.bool,
  onHideSplash: PropTypes.func
};

export default DTIngestEstimator;
