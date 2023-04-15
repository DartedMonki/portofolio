import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';
import { Didact_Gothic } from 'next/font/google';

const didactGothic = Didact_Gothic({
  weight: ['400'],
  subsets: ['latin'],
});

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
  typography: {
    fontFamily: didactGothic.style.fontFamily,
  },
});

export default theme;
