import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import PropTypes from 'prop-types';

function ExportAnnotation(props) {
  function handleFileDownload() {
    props.getData().then((data) => {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = 'annotations.json';
      document.body.appendChild(element);
      element.click();
      setTimeout(() => {
        document.body.removeChild(element);
        URL.revokeObjectURL(file);
      }, 100);
    });
  }

  return (
    <IconButton onClick={handleFileDownload} variant="contained" component="label">
      <DownloadIcon />
    </IconButton>
  );
}

ExportAnnotation.propTypes = {
  getData: PropTypes.func.isRequired,
};

export default ExportAnnotation;
