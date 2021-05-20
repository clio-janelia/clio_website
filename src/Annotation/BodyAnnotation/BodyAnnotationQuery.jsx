import React, {
  useState, useCallback, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import SelectedSegmentsIcon from '@material-ui/icons/TouchAppOutlined';
import SubmitIcon from '@material-ui/icons/FindInPageOutlined';
import WaitIcon from '@material-ui/icons/TimerOutlined';
import { useStyles } from '../DataTable/DataTableUtils';
import QueryEdit from './QueryEdit';

const queryStringify = (json) => {
  if (json === null || json === undefined) {
    return '';
  }

  if (typeof json === 'string') {
    return json;
  }

  let newJson = json;
  if (json.bodyid && typeof json.bodyid === 'string') {
    newJson = { ...json, bodyid: json.bodyid.match(/\d+/g).map(Number) };
  }

  return JSON.stringify(
    newJson,
    (_, v) => (Array.isArray(v) ? JSON.stringify(v) : v), 2,
  ).replace(/"\[/g, '[').replace(/\]"/g, ']');
};

function BodyAnnotationQuery({
  defaultQuery,
  onQueryChanged,
  loading,
  getSelectedSegments,
  addAlert,
}) {
  const classes = useStyles();
  const [query, setQuery] = useState(defaultQuery);

  const submitQuery = () => {
    if (typeof query === 'string') {
      try {
        setQuery(JSON.parse(query));
      } catch (error) {
        setQuery(query);
        addAlert({ severity: 'warning', message: `Invalid query: ${query}` });
      }
    } else {
      setQuery({ ...query });
    }
  };

  useEffect(() => {
    if (query && typeof query !== 'string') {
      onQueryChanged(query);
    }
  }, [query, onQueryChanged]);

  const handleQueryStringChange = useCallback((s) => {
    setQuery(s);
  }, [setQuery]);

  const queryString = useMemo(() => queryStringify(query), [query]);
  const querySelectedSelements = () => {
    const segments = getSelectedSegments();
    const bodyQuery = { bodyid: segments };
    setQuery(bodyQuery);
    if (segments.length > 0) {
      onQueryChanged(bodyQuery);
    }
  };

  return (
    <div className={classes.controlRow}>
      <QueryEdit
        defaultQueryString={queryString}
        onQueryStringChanged={handleQueryStringChange}
        queryStringify={queryStringify}
      />
      <Tooltip title="Submit Query">
        <IconButton
          color="primary"
          onClick={submitQuery}
          disabled={loading}
        >
          {loading ? <WaitIcon /> : <SubmitIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Query Selected Segments">
        <IconButton
          color="primary"
          onClick={querySelectedSelements}
          disabled={loading}
        >
          <SelectedSegmentsIcon />
        </IconButton>
      </Tooltip>
      {/* <Button
        color="primary"
        variant="contained"
        disabled={loading}
        style={{ height: 'fit-content' }}
        onClick={
          () => {
            const segments = getSelectedSegments();
            const bodyQuery = { bodyid: segments };
            setQuery(bodyQuery);
            if (segments.length > 0) {
              onQueryChanged(bodyQuery);
            }
          }
        }
      >
        Selected Segments
      </Button> */}
    </div>
  );
}

BodyAnnotationQuery.propTypes = {
  defaultQuery: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  onQueryChanged: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  getSelectedSegments: PropTypes.func.isRequired,
  addAlert: PropTypes.func.isRequired,
};

BodyAnnotationQuery.defaultProps = {
  defaultQuery: null,
};

export default BodyAnnotationQuery;
