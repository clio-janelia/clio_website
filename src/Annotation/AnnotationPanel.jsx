import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabList from '@material-ui/lab/TabList';
import TabContext from '@material-ui/lab/TabContext';
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
  const [tabValue, setTabValue] = React.useState('0');

  let validChildren = [];
  if (children) {
    validChildren = Array.isArray(children) ? children.filter((child) => child) : [children];
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const index = parseInt(newValue, 10);
    if (config.layers[index]) {
      actions.selectViewerLayer(config.layers[index].name);
    } else {
      actions.selectViewerLayer('');
    }
  };

  React.useEffect(() => {
    setTabValue('0');
  }, [config.datasetName]);

  const numTabs = config.layers.length + validChildren.length;
  const totalWidth = config.width.replace(/\D/g, '');
  const tabWidth = Math.max(totalWidth / numTabs - 20, 100);
  const tabStyle = { minWidth: `${tabWidth}px`, maxWidth: `${tabWidth}px` };

  let tabs = config.layers.map((layer, index) => (
    <Tab label={layer.name} key={layer.name} value={`${index}`} style={tabStyle} />
  ));
  let tabPanels = config.layers.map((layer, index) => (
    <TabPanel key={layer.name} value={`${index}`} className={classes.tabPanel}>
      <AnnotationTable
        dataConfig={layer.dataConfig}
        tools={layer.tools}
        layerName={layer.name}
        locateItem={layer.locateItem}
        setSelectionChangedCallback={layer.setSelectionChangedCallback}
        dataSource={layer.dataSource}
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
      <TabPanel key={child.props.tabName} value={`${startIndex + index}`} className={classes.tabPanel}>
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
    datasetName: PropTypes.string.isRequired,
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
