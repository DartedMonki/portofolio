import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import FabMenu from '~/components/FabMenu';

const DynamicScrollToTop = dynamic(
  () => import('~/src/components/ScrollToTop'),
  { ssr: false },
);

import PortfolioSection from './portfolio-section';
import useHome from './useHome';

export interface HomeProps {
  ipAddress: string;
}

const Home = ({ ipAddress }: HomeProps) => {
  const { data, methods } = useHome({ ipAddress });

  return (
    <>
      <Dialog
        PaperProps={{
          sx: {
            borderRadius: '20px',
          },
        }}
        open={data.openAboutDialog}
        onClose={methods.handleAboutDialog}
      >
        <DialogTitle>{data?.aboutLocale?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'black' }}>
            {data?.aboutLocale?.content?.replace(
              '{years}',
              data.yearsOfExperience || '',
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <DynamicScrollToTop />
      <Box
        sx={{
          position: 'absolute',
          display: 'none',
          color: 'red',
          zIndex: 99,
          whiteSpace: 'nowrap',
        }}
        ref={data.objRef}
      >
        {data.typedWord.length > 0
          ? `${data?.homeLocale?.you}${data.typedWord.join('')}`
          : ''}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Button
          onClick={methods.handleAboutDialog}
          sx={{
            padding: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            ':hover': {
              '& > div': {
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                visibility: 'visible',
              },
            },
          }}
        >
          <Box
            sx={{
              visibility: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              height: '100%',
              width: '100%',
              textTransform: 'none',
              transition: 'background 0.2s linear',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'white',
              }}
            >
              {data?.aboutLocale?.avatar}
            </Typography>
          </Box>
          <Image
            src="https://avatars.githubusercontent.com/u/12370632?v=4"
            width={200}
            height={200}
            alt="github-avatar"
          />
        </Button>
        <Typography variant="h4" component="h1" color="white" gutterBottom>
          afriyadi y. r.
        </Typography>
      </Box>
      <FabMenu />
      <PortfolioSection />
    </>
  );
};

export default Home;
