import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';

import Grid from '@material-ui/core/Grid';

import MatchListLoader from './MatchListLoader';

export default function ByExampleResults({
  mousePosition,
  dataset,
  actions,
}) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  return (
    <Grid container spacing={3}>
      {(mousePosition && mousePosition.length > 0 && user && dataset && clioUrl)
        ? (
          <MatchListLoader
            user={user}
            coords={mousePosition}
            dataset={dataset}
            clioUrl={clioUrl}
            actions={actions}
          />
        )
        : 'Loading...'}
    </Grid>
  );
}

ByExampleResults.propTypes = {
  mousePosition: PropTypes.arrayOf(PropTypes.number).isRequired,
  actions: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
};
