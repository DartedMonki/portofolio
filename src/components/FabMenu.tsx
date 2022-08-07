import {
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import { Fab } from '@mui/material';

const FabMenu = () => {
  return (
    <>
      <Fab
        sx={{
          position: 'absolute',
          bottom: '50px',
          right: {
            sm: '170px',
            xs: '110px',
          },
          bgcolor: 'white',
          ':hover': {
            opacity: 0.9,
          },
        }}
        aria-label="linkedIn"
        href="https://www.linkedin.com/in/daniafriyadi/"
        target="_blank"
        rel="noreferrer noopener"
      >
        <LinkedInIcon htmlColor="black" />
      </Fab>
      <Fab
        sx={{
          position: 'absolute',
          bottom: '50px',
          right: {
            sm: '100px',
            xs: '40px',
          },
          bgcolor: 'white',
          ':hover': {
            opacity: 0.9,
          },
        }}
        aria-label="github"
        href="https://github.com/DartedMonki"
        target="_blank"
        rel="noreferrer noopener"
      >
        <GitHubIcon htmlColor="black" />
      </Fab>
    </>
  );
};

export default FabMenu;
