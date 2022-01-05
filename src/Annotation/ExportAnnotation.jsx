import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import Tooltip from '@material-ui/core/Tooltip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import { annotationToCsv } from './AnnotationUtils';

function ExportAnnotation({
  kind, getData, fields,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  function handleFileDownload(format) {
    getData().then((data) => {
      const element = document.createElement('a');
      const blobData = (format === 'csv') ? annotationToCsv(data, fields) : JSON.stringify(data, null, 2);
      const file = new Blob([blobData], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = ((kind === 'Atlas') ? 'atlas.' : 'annotations.') + format;
      document.body.appendChild(element);
      element.click();
      setTimeout(() => {
        document.body.removeChild(element);
        URL.revokeObjectURL(file);
      }, 100);
    });
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleCsvDownload() {
    handleFileDownload('csv');
    handleClose();
  }

  function handleJsonDownload() {
    handleFileDownload('json');
    handleClose();
  }

  return (
    <div>
      <Tooltip title={`Download ${(kind === 'Atlas') ? 'atlas points' : 'annotations'}`}>
        <IconButton
          aria-controls={open ? 'download-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          variant="contained"
          component="label"
        >
          <DownloadIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="download-menu"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleCsvDownload}>CSV</MenuItem>
        <MenuItem onClick={handleJsonDownload}>JSON</MenuItem>
      </Menu>
    </div>
  );
}

ExportAnnotation.propTypes = {
  getData: PropTypes.func.isRequired,
  kind: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
};

ExportAnnotation.defaultProps = {
  kind: 'Normal',
};

export default ExportAnnotation;
