// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// EKMS React components
import MDBox from "components/MDBox/MDBox";

// Custom styles for the SidenavCollapse
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
} from "examples/Sidenav/styles/sidenavCollapse";

// EKMS React context
import { useMaterialUIController } from "contexts/muiContext";

function SidenavCollapse({ icon, name, active, hasChildren, isExpanded, onClick, noCollapse, ...rest }: any) {
  const [controller] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;

  const handleClick = (e) => {
    if (hasChildren && onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <ListItem 
      component="li"
      onClick={handleClick}
      sx={{ cursor: hasChildren ? 'pointer' : 'default' }}
    >
      <MDBox
        {...rest}
        sx={(theme) =>
          collapseItem(theme, {
            active,
            transparentSidenav,
            whiteSidenav,
            darkMode,
            sidenavColor,
          })
        }
      >
        <ListItemIcon
          sx={(theme) =>
            collapseIconBox(theme, { transparentSidenav, whiteSidenav, darkMode, active })
          }
        >
          {typeof icon === "string" ? (
            <Icon sx={(theme) => collapseIcon(theme, { active })}>{icon}</Icon>
          ) : (
            icon
          )}
        </ListItemIcon>

        <ListItemText
          primary={name}
          sx={(theme) =>
            collapseText(theme, {
              miniSidenav,
              transparentSidenav,
              whiteSidenav,
              active,
            })
          }
        />
        
        {hasChildren && (
          <Icon 
            fontSize="small" 
            sx={{ 
              ml: 1,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              color: active ? 'inherit' : 'text.secondary'
            }}
          >
            expand_more
          </Icon>
        )}
      </MDBox>
    </ListItem>
  );
}

// Setting default values for the props of SidenavCollapse
SidenavCollapse.defaultProps = {
  active: false,
  hasChildren: false,
  isExpanded: false,
  onClick: () => {},
};

// Typechecking props for the SidenavCollapse
SidenavCollapse.propTypes = {
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
  hasChildren: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onClick: PropTypes.func,
  noCollapse: PropTypes.bool,
  sx: PropTypes.object,
};

export default SidenavCollapse;
