import React from 'react';
import PropTypes from 'prop-types';
import Select from '@material-ui/core/Select';
import ReactSelect from 'react-select';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import { useTheme } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  select: {
    fontFamily: theme.typography.fontFamily,
    width: '15em',
    marginLeft: '2em',
  },
}));

// eslint-disable-next-line object-curly-newline
export default function DataSetSelection({ datasets, onChange, selected, forNav }) {
  const classes = useStyles();
  const theme = useTheme();

  const selectStyles = {
    placeholder: () => ({
      color: '#fff',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#fff',
    }),
    menu: (provided) => ({
      ...provided,
      color: '#333',
    }),
    control: (provided) => ({
      ...provided,
      background: theme.palette.primary.main,
      border: '1px solid #fff',
    }),
  };

  const handleChange = (event) => {
    onChange(event.target.value);
  };

  function handleAltChange(chosen) {
    onChange(chosen.value);
  }

  if (forNav) {
    const altOptions = datasets.filter((dataset) => !dataset.navHide).map((dataset) => ({
      value: dataset.name,
      label: `${dataset.title} - ${dataset.description}`,
    }));
    const selectedDataset = datasets.find((dataset) => dataset.name === selected);
    const value = selected
      ? { value: selected, label: selectedDataset ? selectedDataset.title : '' }
      : null;
    return (
      <ReactSelect
        onChange={handleAltChange}
        value={value}
        className={classes.select}
        styles={selectStyles}
        options={altOptions}
        noOptionsMessage={() => 'You are not authorized to view any datasets in this project'}
        placeholder="Select a dataset..."
      />
    );
  }

  /* eslint-disable react/jsx-one-expression-per-line */

  const options = datasets.filter((dataset) => !dataset.navHide).map((dataset) => (
    <MenuItem key={dataset.name} value={dataset.name}>
      {dataset.title} - {dataset.description}
    </MenuItem>
  ));
  /* eslint-enable */
  return (
    <Select onChange={handleChange} value={selected}>
      {options}
    </Select>
  );
}

DataSetSelection.propTypes = {
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  forNav: PropTypes.bool,
};

DataSetSelection.defaultProps = {
  selected: null,
};

DataSetSelection.defaultProps = {
  forNav: false,
};
