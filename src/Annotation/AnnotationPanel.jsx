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
    annotationRoot: {
      display: 'flex',
      flexFlow: 'column',
      width: '500px',
    },
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
  const classes = useStyles();
  const [tabValue, setTabValue] = React.useState('0');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const index = parseInt(newValue, 10);
    if (config.layers[index]) {
      actions.selectViewerLayer(config.layers[index].name);
    }
  };

  let tabs = config.layers.map((layer, index) => (
    <Tab label={layer.name} key={layer.name} value={`${index}`} />
  ));
  let tabPanels = config.layers.map((layer, index) => (
    <TabPanel key={layer.name} value={`${index}`} className={classes.tabPanel}>
      <AnnotationTable
        dataConfig={layer.dataConfig}
        tools={layer.tools}
        layerName={layer.name}
        locateItem={layer.locateItem}
        actions={actions}
      />
    </TabPanel>
  ));

  if (children) {
    let childArray = children;
    if (!Array.isArray(childArray)) {
      childArray = [children];
    }
    const startIndex = tabs.length;
    tabs = tabs.concat(childArray.map((child, index) => (
      <Tab label={child.props.tabName} key={child.props.tabName} value={`${startIndex + index}`} />
    )));

    tabPanels = tabPanels.concat(childArray.map((child, index) => (
      <TabPanel key={child.props.tabName} value={`${startIndex + index}`} className={classes.tabPanel}>
        {child}
      </TabPanel>
    )));
  }

  return (
    <div className={classes.annotationRoot}>
      <TabContext value={tabValue}>
        <TabList onChange={handleTabChange} className={classes.tabContainer}>
          {tabs}
        </TabList>
        {tabPanels}
      </TabContext>
    </div>
  );
}

AnnotationPanel.propTypes = {
  config: PropTypes.shape({
    layers: PropTypes.arrayOf(PropTypes.shape({
      dataConfig: PropTypes.object,
      name: PropTypes.string,
    })),
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
