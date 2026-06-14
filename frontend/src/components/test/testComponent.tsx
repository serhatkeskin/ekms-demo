import React, { useEffect } from 'react';
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';

function TestComponent() {
  useEffect(() => {
    console.log("TestComponent mounted!");
    document.title = "Test Component";
  }, []);

  return (
    <MDBox
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      bgcolor="background.paper"
    >
      <MDTypography variant="h2" color="primary" gutterBottom>
        Test Component Works!
      </MDTypography>
      <MDTypography variant="body1">
        If you can see this, your routing is working correctly.
      </MDTypography>
    </MDBox>
  );
}

export default TestComponent;