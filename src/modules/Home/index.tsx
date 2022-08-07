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

const Home = () => {
  const { data, methods } = useHome();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          position: 'absolute',
          display: 'none',
        }}
        ref={data.objRef}
      >
        {data.typedWord.length > 0 ? `You: ${data.typedWord.join('')}` : ''}
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
              Who am I?
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
        <DialogTitle>About me</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'black' }}>
            I&apos;m a Software Engineer with {YEARS_OF_EXPERIENCE} years of
            experience. I&apos;m experienced in using web development frameworks
            and libraries such as React.js, Next.js, Vue.js, and Laravel.
            I&apos;ve also created a simple platformer game using Unity.
            I&apos;m a bachelor of Computer Science from IPB University.
            I&apos;m very interested in web programming and game development.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Home;