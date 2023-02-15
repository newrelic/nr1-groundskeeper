import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'nr1';

const AllOptionsList = ({ optionsFor = '', optionsList = [] }) => {
  const [options, setOptions] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const regexSafeStr = filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRE = new RegExp(regexSafeStr, 'i');
    setOptions(
      optionsList.filter(
        ({
          props: { children: [{ props: { label = '' } = {} }] = [{}] } = {}
        } = {}) => label.match(searchRE)
      )
    );
  }, [optionsList]);

  const changeHandler = useCallback(({ target: { value = '' } = {} } = {}) => {
    const regexSafeStr = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRE = new RegExp(regexSafeStr, 'i');
    setOptions(
      optionsList.filter(
        ({
          props: { children: [{ props: { label = '' } = {} }] = [{}] } = {}
        } = {}) => label.match(searchRE)
      )
    );
    setFilterText(value);
  });

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="title">
          Showing all{' '}
          <span className="values-for">{optionsFor || 'accounts'}</span>
        </div>
        <div className="filter">
          <div className="tf-icon">
            <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__SEARCH} />
          </div>
          <input
            placeholder="Search..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={filterText}
            onChange={changeHandler}
            style={{ backgroundColor: '#fff' }}
          />
        </div>
        <div className="values">{options}</div>
      </div>
    </div>
  );
};

AllOptionsList.propTypes = {
  optionsFor: PropTypes.string,
  optionsList: PropTypes.array
};

export default AllOptionsList;
