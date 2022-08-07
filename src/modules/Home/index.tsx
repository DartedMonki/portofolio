import {
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import FabMenu from '~/components/FabMenu';
import { YEARS_OF_EXPERIENCE } from '~/constants/global';

import useHome from './useHome';

export interface HomeProps {
  ipAddress: string;
}

const Home = ({ ipAddress }: HomeProps) => {
  const { data, methods } = useHome({ ipAddress });

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          position: 'absolute',
          display: 'none',
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
        <Typography variant="h4" component="h1" gutterBottom>
          afriyadi y. r.
        </Typography>
      </Box>
      <FabMenu />
      <Dialog open={data.openAboutDialog} onClose={methods.handleAboutDialog}>
        <DialogTitle>{data?.aboutLocale?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'black' }}>
            {data?.aboutLocale?.content?.replace(
              '{years}',
              YEARS_OF_EXPERIENCE || '',
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Home;
