// src/components/Switch.jsx
import React from 'react';
import { Switch as MuiSwitch } from '@mui/material';

const Switch = ({ checked, onChange }) => {
  return (
    <MuiSwitch
      checked={checked}
      onChange={onChange}
      color="primary"
    />
  );
};

export default Switch;
