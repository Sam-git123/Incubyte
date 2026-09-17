import {
  AppBar,
  Box,
  CssBaseline,
  List,
  ListItemButton,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, Navigate, Route, Routes } from 'react-router-dom';

import { appTheme } from './app/theme';
import { EmployeeDirectory } from './features/employees/components/EmployeeDirectory';
import { EmployeeDetails } from './features/employees/components/EmployeeDetails';

export function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }}>
            <Box
              aria-hidden="true"
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 1.5,
                display: 'flex',
                fontWeight: 800,
                height: 38,
                justifyContent: 'center',
                mr: 1.5,
                width: 38,
              }}
            >
              A
            </Box>
            <Box>
              <Typography component="h1" sx={{ lineHeight: 1.1 }} variant="h6">
                ACME Salary Management
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.72)' }}
              >
                People Operations
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>
          <Box
            component="nav"
            aria-label="Primary navigation"
            sx={{
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              display: { xs: 'none', md: 'block' },
              flexShrink: 0,
              px: 2,
              py: 3,
              width: 224,
            }}
          >
            <Typography
              color="text.secondary"
              sx={{ fontWeight: 700, px: 2, textTransform: 'uppercase' }}
              variant="overline"
            >
              Workspace
            </Typography>
            <List disablePadding sx={{ mt: 1 }}>
              <ListItemButton
                component={RouterLink}
                selected
                sx={{ borderRadius: 1.5 }}
                to="/employees"
              >
                <ListItemText
                  primary="Employees"
                  slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                />
              </ListItemButton>
            </List>
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              px: { xs: 2, sm: 3, lg: 5 },
              py: { xs: 3, sm: 4 },
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate replace to="/employees" />} />
              <Route path="/employees" element={<EmployeeDirectory />} />
              <Route
                path="/employees/:employeeId"
                element={<EmployeeDetails />}
              />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
