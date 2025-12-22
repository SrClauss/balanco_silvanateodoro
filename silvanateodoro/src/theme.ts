import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b5cff', // deep Azure
    },
    secondary: {
      main: '#ffb020', // warm amber
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h6: { fontWeight: 600 }
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 1
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48
        }
      }
    }
  }
});

export default theme;
