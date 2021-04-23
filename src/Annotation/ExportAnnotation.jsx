import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from 'prop-types';

function ExportAnnotation(props) {
  const { kind, getData } = props;

  function handleFileDownload() {
    getData().then((data) => {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = (kind === 'Atlas') ? 'atlas.json' : 'annotations.json';
      document.body.appendChild(element);
      element.click();
      setTimeout(() => {
        document.body.removeChild(element);
        URL.revokeObjectURL(file);
      }, 100);
    });
  }

  return (
    <Tooltip title={`Download ${(kind === 'Atlas') ? 'atlas points' : 'annotations'}`}>
      <IconButton onClick={handleFileDownload} variant="contained" component="label">
        <DownloadIcon />
      </IconButton>
    </Tooltip>
  );
}

ExportAnnotation.propTypes = {
  getData: PropTypes.func.isRequired,
  kind: PropTypes.string,
};

ExportAnnotation.defaultProps = {
  kind: 'Normal',
};

export default ExportAnnotation;
