import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Chip from '@material-ui/core/Chip';
import ExpandableEdit from '../BodyAnnotation/ExpandableEdit';

export default function StringListEdit({
  value,
  onChange,
}) {
  const [items, setItems] = React.useState(value);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const itemList = items.map((item) => (
    <Chip
      key={item}
      size="small"
      label={item}
      onDelete={() => setItems(items.filter((x) => x !== item))}
    />
  ));

  const handleItemAdded = (item) => {
    if (item) {
      setItems((prevItems) => {
        // Add new item only
        if (prevItems.indexOf(item) === -1) {
          return [...prevItems, item];
        }

        return prevItems;
      });
    }
  };

  return (
    <div>
      <span>{itemList}</span>
      <span>
        <ExpandableEdit
          initialValue={null}
          onValueChanged={handleItemAdded}
          resetAfterValueChange
        />
      </span>
    </div>
  );
}

StringListEdit.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
};

StringListEdit.defaultProps = {
  value: [],
};
