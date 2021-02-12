import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import UploadIcon from '@material-ui/icons/CloudUploadOutlined';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from 'prop-types';

function ImportAnnotation(props) {
  const { kind, upload, addAlert } = props;
  const handleFileUpload = React.useCallback((event) => {
    // console.log(event.target.files[0]);
    // console.log(event.target.value);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (reader.result) {
          // console.log(reader.result);
          upload(reader.result).catch((e) => {
            addAlert({
              severity: 'error',
              message: `Failed to upload annotations: ${e}`,
            });
          });
        }
      } catch (e) {
        addAlert({
          severity: 'error',
          message: `Failed to upload annotations: ${e}`,
        });
      }
    };
    reader.readAsText(event.target.files[0]);
  }, [upload, addAlert]);

  return (
    <Tooltip title={`Upload ${(kind === 'Atlas') ? 'atlas points' : 'annotations'} from a file`}>
      <IconButton variant="contained" component="label">
        <UploadIcon />
        <input type="file" hidden onChange={(e) => { handleFileUpload(e); e.target.value = null; }} />
      </IconButton>
    </Tooltip>
  );
}

ImportAnnotation.propTypes = {
  upload: PropTypes.func.isRequired,
  addAlert: PropTypes.func.isRequired,
  kind: PropTypes.string,
};

ImportAnnotation.defaultProps = {
  kind: 'Annotation',
};

export default ImportAnnotation;
