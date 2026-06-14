import React from 'react';
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDButton from 'components/MDButton/MDButton';

const ProjectFilters = ({ 
  filterName, 
  setFilterName, 
  filterStatus, 
  setFilterStatus, 
  applyFilters, 
  resetFilters 
}: any) => {
  // Handle filter name change
  const handleFilterNameChange = (event) => {
    setFilterName(event.target.value);
  };
  
  // Handle filter status change
  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
  };

  return (
    <Card>
      <MDBox p={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by Name"
              variant="outlined"
              fullWidth
              value={filterName}
              onChange={handleFilterNameChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleFilterStatusChange}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <MDButton 
                variant="outlined" 
                color="warning"
                onClick={resetFilters}
              >
                Reset
              </MDButton>
            </Grid>
            <Grid item>
              <MDButton 
                variant="gradient" 
                color="warning"
                onClick={applyFilters}
              >
                Filter
              </MDButton>
            </Grid>
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
};

export default ProjectFilters;