import { GitHub as GitHubIcon, LinkedIn as LinkedInIcon } from '@mui/icons-material';
import { Fab } from '@mui/material';
import { useRouter } from 'next/router';

import { GITHUB_URL, LINKEDIN_URL } from '../constants/constant';

const FabMenu = () => {
  const { asPath, locale, pathname, push, query } = useRouter();

  return (
    <>
      <Fab
        sx={{
          position: 'absolute',
          bottom: '50px',
          right: {
            sm: '240px',
            xs: '180px',
          },
          bgcolor: 'white',
          ':hover': {
            opacity: 0.9,
          },
        }}
        aria-label="language"
        onClick={() =>
          push({ pathname, query }, asPath, {
            locale: locale === 'en' ? 'id' : 'en',
          })
        }
      >
        {locale}
      </Fab>
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
        href={LINKEDIN_URL}
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
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer noopener"
      >
        <GitHubIcon htmlColor="black" />
      </Fab>
    </>
  );
};

export default FabMenu;
