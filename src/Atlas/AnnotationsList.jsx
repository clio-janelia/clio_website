import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Chip from '@material-ui/core/Chip';
import DoneIcon from '@material-ui/icons/Done';

import { makeStyles } from '@material-ui/core/styles';
import { getDatasetLocation } from '../utils/neuroglancer';

const useStyles = makeStyles((theme) => ({
  selected: {
    border: '2px solid',
    borderColor: theme.palette.primary.main,
    background: 'rgba(143, 170, 143, 0.3)',
  },
}));

const imageSliceUrlTemplate = 'https://tensorslice-bmcp5imp6q-uk.a.run.app/slice/<xyz>/256_256_1/jpeg?location=<location>';

export default function AnnotationsList({
  annotations,
  selected,
  pages,
  currentPage,
  onChange,
  onSelect,
  datasets,
  loading,
}) {
  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);
  const canWrite = roles.global_roles && roles.global_roles.includes('clio_write');

  const classes = useStyles();

  // move this to parent component
  const handlePageChange = (event, page) => {
    onChange(page);
  };

  if (loading) {
    return <CircularProgress />;
  }

  // move this to parent component
  const handleClick = (annotation) => {
    onSelect(annotation);
  };

  const annotationSelections = annotations.map((annotation) => {
    const {
      title: name,
      dataset: dataSet,
      description,
      timestamp,
      location,
      verified,
      id,
    } = annotation;

    let thumbnailUrl = '';
    const selectedDataSet = datasets[dataSet] || {};
    if (selectedDataSet && 'location' in selectedDataSet) {
      const datasetLocation = getDatasetLocation(selectedDataSet).replace('gs://', '');
      const xyzString = `${location[0] - 128}_${location[1] - 128}_${location[2]}`;

      thumbnailUrl = imageSliceUrlTemplate
        .replace('<location>', datasetLocation)
        .replace('<xyz>', xyzString);
    }

    const key = `${name}_${timestamp}`;
    const isSelected = selected && key === `${selected.title}_${selected.timestamp}`;

    const verifiedChip = verified ? (
      <Chip label="Verified" color="primary" icon={<DoneIcon />} />
    ) : (
      <Chip label="Unverified" />
    );

    if (!id) {
      console.log(canWrite);
    }
    return (
      <Grid key={key} item xs={12} sm={3}>
        <Card raised={isSelected} className={isSelected ? classes.selected : ''}>
          <CardActionArea onClick={() => handleClick(annotation)}>
            <CardMedia
              component="img"
              alt="x y slice around annotation"
              height="256"
              image={thumbnailUrl}
              title="x y slice around annotation"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                {name}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                {description || 'No description provided'}
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                Dataset: {selectedDataSet.description}
              </Typography>
            </CardContent>
          </CardActionArea>
          <CardActions>
            <Button size="small" color="primary" onClick={() => handleClick(annotation)}>
              View
            </Button>
            {verifiedChip}
          </CardActions>
        </Card>
      </Grid>
    );
  });

  return (
    <>
      <Pagination count={pages} page={currentPage} onChange={handlePageChange} size="small" />
      <Grid container spacing={3}>
        {annotationSelections}
      </Grid>
    </>
  );
}

AnnotationsList.propTypes = {
  pages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  selected: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  datasets: PropTypes.object.isRequired,
  annotations: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
};

AnnotationsList.defaultProps = {
  selected: null,
};
