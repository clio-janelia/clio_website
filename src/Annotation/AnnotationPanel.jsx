import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
// import TabPanel from '@material-ui/lab/TabPanel';
import TabList from '@material-ui/lab/TabList';
import TabContext from '@material-ui/lab/TabContext';
import { useHistory, useLocation } from 'react-router-dom';
import TabPanel from '../components/TabPanel';
import AnnotationTable from './AnnotationTable';

const useStyles = makeStyles((theme) => (
  {
    annotationRoot: (props) => ({
      display: 'flex',
      flexFlow: 'column',
      width: props.width,
    }),
    tabContainer: {
      background: theme.palette.primary.light,
      color: theme.palette.common.white,
    },
    tabPanel: {
      margin: '0px',
      padding: '0px',
    },
  }
));

export default function AnnotationPanel(props) {
  const { config, actions, children } = props;
  const classes = useStyles({ width: config.width });
  const history = useHistory();
  const location = useLocation();
  const previousDatasetRef = React.useRef(null);

  const validChildren = React.useMemo(() => {
    if (!children) return [];
    return Array.isArray(children) ? children.filter((child) => child) : [children];
  }, [children]);

  // Build map of tab names to indices
  const tabNameToIndex = React.useMemo(() => {
    const map = {};
    config.layers.forEach((layer, index) => {
      map[layer.name] = `${index}`;
    });
    const startIndex = config.layers.length;
    validChildren.forEach((child, index) => {
      map[child.props.tabName] = `${startIndex + index}`;
    });
    return map;
  }, [config.layers, validChildren]);

  // Initialize tab from URL or default to '0'
  const getInitialTab = React.useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    if (urlTab && tabNameToIndex[urlTab]) {
      return tabNameToIndex[urlTab];
    }
    return '0';
  }, [location.search, tabNameToIndex]);

  const [tabValue, setTabValue] = React.useState(getInitialTab);

  // Update URL when tab changes
  const updateUrl = React.useCallback((tabIndex) => {
    const searchParams = new URLSearchParams(location.search);

    // Find tab name from index
    let tabName = null;
    const index = parseInt(tabIndex, 10);
    if (index < config.layers.length) {
      tabName = config.layers[index].name;
    } else {
      const childIndex = index - config.layers.length;
      if (childIndex < validChildren.length) {
        tabName = validChildren[childIndex].props.tabName;
      }
    }

    if (tabName) {
      searchParams.set('tab', tabName);
    } else {
      searchParams.delete('tab');
    }

    const newUrl = searchParams.toString()
      ? `${location.pathname}?${searchParams.toString()}`
      : location.pathname;
    history.replace(newUrl);
  }, [location.pathname, location.search, history, config.layers, validChildren]);

  const handleTabChange = React.useCallback((event, newValue) => {
    if (tabValue !== newValue) {
      setTabValue(newValue);
      updateUrl(newValue);
      const index = parseInt(newValue, 10);
      if (config.layers[index]) {
        actions.selectViewerLayer(config.layers[index].name);
      } else {
        actions.selectViewerLayer('');
      }
    }
  }, [config.layers, actions, tabValue, updateUrl]);

  // Reset to first tab when dataset changes (but not on initial mount)
  React.useEffect(() => {
    if (previousDatasetRef.current !== null && previousDatasetRef.current !== config.dataset.name) {
      setTabValue('0');
      const searchParams = new URLSearchParams(location.search);
      const firstTabName = config.layers[0] && config.layers[0].name;
      if (firstTabName) {
        searchParams.set('tab', firstTabName);
        const newUrl = searchParams.toString()
          ? `${location.pathname}?${searchParams.toString()}`
          : location.pathname;
        history.replace(newUrl);
      }
    }
    previousDatasetRef.current = config.dataset.name;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.dataset.name]);

  // Sync tab from URL on location change
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    if (urlTab && tabNameToIndex[urlTab]) {
      const newTabValue = tabNameToIndex[urlTab];
      if (newTabValue !== tabValue) {
        setTabValue(newTabValue);
        const index = parseInt(newTabValue, 10);
        if (config.layers[index]) {
          actions.selectViewerLayer(config.layers[index].name);
        } else {
          actions.selectViewerLayer('');
        }
      }
    }
  }, [location.search, tabNameToIndex, tabValue, config.layers, actions]);

  const numTabs = config.layers.length + validChildren.length;
  const totalWidth = config.width.replace(/\D/g, '');
  const tabWidth = Math.max(totalWidth / numTabs - 20, 100);
  const tabStyle = { minWidth: `${tabWidth}px`, maxWidth: `${tabWidth}px` };

  let tabs = config.layers.map((layer, index) => (
    <Tab label={layer.name} key={layer.name} value={`${index}`} style={tabStyle} />
  ));
  let tabPanels = config.layers.map((layer, index) => (
    <TabPanel key={`${config.dataset.name}-${layer.name}`} value={`${index}`} className={classes.tabPanel}>
      <AnnotationTable
        dataConfig={layer.dataConfig}
        tools={layer.tools}
        layerName={layer.name}
        locateItem={layer.locateItem}
        setSelectionChangedCallback={layer.setSelectionChangedCallback}
        dataSource={layer.dataSource}
        projectUrl={config.projectUrl}
        dataset={config.dataset}
        user={config.user}
        actions={actions}
      />
    </TabPanel>
  ));

  if (validChildren) {
    const startIndex = tabs.length;
    tabs = tabs.concat(validChildren.map((child, index) => (
      <Tab label={child.props.tabName} key={child.props.tabName} value={`${startIndex + index}`} style={tabStyle} />
    )));

    tabPanels = tabPanels.concat(validChildren.map((child, index) => (
      <TabPanel key={`${config.dataset.name}-${child.props.tabName}`} value={`${startIndex + index}`} className={classes.tabPanel}>
        {child}
      </TabPanel>
    )));
  }

  return (
    <div className={classes.annotationRoot}>
      <TabContext value={tabValue}>
        <TabList onChange={handleTabChange} className={classes.tabContainer} variant="scrollable">
          {tabs}
        </TabList>
        {tabPanels}
      </TabContext>
    </div>
  );
}

AnnotationPanel.propTypes = {
  config: PropTypes.shape({
    projectUrl: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired,
    user: PropTypes.string.isRequired,
    layers: PropTypes.arrayOf(PropTypes.shape({
      dataConfig: PropTypes.object,
      name: PropTypes.string,
      dataSource: PropTypes.object,
    })),
    width: PropTypes.string,
  }).isRequired,
  actions: PropTypes.object.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.object,
  ]),
};

AnnotationPanel.defaultProps = {
  children: null,
};
