import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTabContext } from '@material-ui/lab/TabContext';

/**
 * Tab panel to keep tabs from unmounting when switching between tabs.
 * Adopted from https://github.com/ambroseus/mui-tab-panel-demo
 */
export default function TabPanel(props) {
  const {
    children,
    className,
    style,
    value,
  } = props;

  const [visible, setVisible] = React.useState(false);

  const context = useTabContext();

  if (context === null) {
    throw new TypeError('No TabContext provided');
  }
  const { value: tabId } = context;

  useEffect(() => {
    setVisible(tabId === value);
  }, [tabId, value]);

  return (
    <div
      className={className}
      style={{
        width: visible ? '100%' : 0,
        margin: 0,
        padding: 0,
        display: 'flex',
        ...style,
        // position: 'absolute',
        height: visible ? 'auto' : 0,
        left: 0,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  value: PropTypes.string,
};

TabPanel.defaultProps = {
  value: '0',
  children: null,
  className: '',
  style: {},
};
