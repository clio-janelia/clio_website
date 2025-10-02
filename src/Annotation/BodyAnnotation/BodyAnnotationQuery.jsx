import React, {
  useState, useCallback, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import SelectedSegmentsIcon from '@material-ui/icons/TouchAppOutlined';
import SubmitIcon from '@material-ui/icons/FindInPageOutlined';
import WaitIcon from '@material-ui/icons/TimerOutlined';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useStyles } from '../DataTable/DataTableUtils';
import QueryEdit from './QueryEdit';

const stringifyQueryObject = (json) => {
  if (json === null || json === undefined) {
    return '';
  }

  if (typeof json === 'string') {
    return json;
  }

  const s = Object.keys(json).reduce((result, key) => `${result}\n  "${key}": ${JSON.stringify(json[key])},`, '');

  return s ? `{${s.slice(0, -1)}\n}` : '{}';
};

const queryStringify = (json) => {
  if (json === null || json === undefined) {
    return '';
  }

  if (typeof json === 'string') {
    return json;
  }

  if (Array.isArray(json)) {
    return `[\n${json.filter((item) => item && Object.keys(item).length > 0).map(stringifyQueryObject).join(',')}\n]`;
  }

  return stringifyQueryObject(json);
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
  const [helpOpen, setHelpOpen] = useState(false);

  const submitQuery = () => {
    if (typeof query === 'string') {
      try {
        setQuery(JSON.parse(query));
      } catch (error) {
        setQuery(query);
        addAlert({ severity: 'warning', message: `Invalid query: ${query}` });
      }
    } else if (Array.isArray(query)) {
      setQuery([...query]);
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
    <>
      <div style={{ position: 'relative' }}>
        <Tooltip title="Help" arrow>
          <IconButton
            size="small"
            onClick={() => setHelpOpen(true)}
            color="primary"
            style={{ position: 'absolute', top: 0, right: 0 }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <div className={classes.controlRow}>
          <QueryEdit
            defaultQueryString={queryString}
            onQueryStringChanged={handleQueryStringChange}
            queryStringify={queryStringify}
          />
          <Tooltip
            title={loading ? 'Loading' : 'Submit Query'}
            arrow
          >
            <span>
              <IconButton
                color="primary"
                onClick={submitQuery}
                disabled={loading}
              >
                {loading ? <WaitIcon fontSize="large" /> : <SubmitIcon fontSize="large" />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={loading ? 'Loading' : 'Query Selected Segments'} arrow>
            <span>
              <IconButton
                color="primary"
                onClick={querySelectedSelements}
                disabled={loading}
              >
                <SelectedSegmentsIcon fontSize="large" />
              </IconButton>
            </span>
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
      </div>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Query JSON Format Help</DialogTitle>
        <DialogContent>
          <p>
            Use JSON format to query body annotations. The query can be a single object or an array
            of objects.
          </p>

          <h4>Single Object Query:</h4>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {`{
  "status": ["Anchor", "Roughly traced"],
  "bodyid": [123456, 789012]
}`}
          </pre>

          <h4>Array Query (OR logic):</h4>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {`[
  { "status": "Anchor" },
  { "bodyid": 123456 }
]`}
          </pre>

          <h4>Common Fields:</h4>
          <ul>
            <li>
              <strong>bodyid:</strong> Body ID(s) to query (number or array of numbers)
            </li>
            <li>
              <strong>status:</strong> Status value(s) (string or array of strings)
            </li>
            <li>
              <strong>user:</strong> User name(s) (string or array of strings)
            </li>
            <li>Other custom annotation fields as defined in your dataset</li>
          </ul>

          <h4>Examples:</h4>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {`// Query by status
{ "status": "Anchor" }

// Query by multiple statuses
{ "status": ["Anchor", "Roughly traced"] }

// Query by body IDs
{ "bodyid": [123456, 789012, 345678] }

// Query by user
{ "user": "john.doe" }

// Combine multiple fields (AND logic)
{
  "status": "Anchor",
  "user": "john.doe"
}`}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

BodyAnnotationQuery.propTypes = {
  defaultQuery: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object),
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
