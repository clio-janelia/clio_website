import React, { useEffect, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles((theme) => ({
  container: {
  },
  itemContainer: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
  },
}));

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36);
}

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, { value: action.value, id: generateId() }];
    case 'remove':
      return state.filter((item) => item.id !== action.id);
    case 'update':
      return state.map(
        (item) => (item.id === action.payload.id
          ? { ...item, value: action.payload.value }
          : item),
      );
    default:
      return state;
  }
}

function ElementContainer({
  id,
  element,
  renderElement,
  update,
}) {
  const updateElement = useCallback((newElement) => {
    update(id, newElement);
  }, [id, update]);

  return renderElement(element, updateElement);
}

const ElementContainerMemo = React.memo(ElementContainer);

/**
 * A component for editing a list.
 *
 * It is a container for hosting a list for editing. The user can add, remove, or
 * change an element of a list using this component.
 */
export default function ListEdit({
  defaultValue,
  onValueChange,
  renderElement,
}) {
  const [state, dispatch] = useReducer(
    reducer,
    defaultValue.map((element) => ({ value: element, id: generateId() })),
  );

  const classes = useStyles();

  const updateElement = useCallback((id, value) => {
    dispatch({ type: 'update', payload: { value, id } });
  }, []);
  const addElement = useCallback((value) => {
    dispatch({ type: 'add', value });
  }, []);
  const removeElement = useCallback((id) => {
    dispatch({ type: 'remove', id });
  }, []);

  useEffect(() => {
    onValueChange(state.map((item) => item.value));
  }, [state, onValueChange]);

  const makeElementControl = (item) => (state.length > 1 ? (
    <IconButton onClick={() => removeElement(item.id)}>
      <DeleteIcon />
    </IconButton>
  ) : null);

  return (
    <div className={classes.container}>
      {state.map((item) => (
        <Paper
          key={item.id}
          variant="outlined"
          className={classes.itemContainer}
          square
        >
          <div style={{ width: '90%' }}>
            <ElementContainerMemo
              id={item.id}
              element={item.value}
              renderElement={renderElement}
              update={updateElement}
            />
          </div>
          {makeElementControl(item)}
        </Paper>
      ))}
      <IconButton onClick={() => addElement(undefined)}>
        <AddCircleOutline />
      </IconButton>
    </div>
  );
}

ListEdit.propTypes = {
  /** Default list for the component */
  defaultValue: PropTypes.arrayOf(PropTypes.any).isRequired,
  /** Callback function for when the list is changed */
  onValueChange: PropTypes.func.isRequired,
  /** Callback function for rendering an element. Two arguments will be passed
   * to the callback:
   *  - Value of the list element to be rendered
   *  - A function for handling the value change of the element
   */
  renderElement: PropTypes.func.isRequired,
};
