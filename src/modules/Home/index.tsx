import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { type FC, memo, useCallback, useMemo } from 'react';

import useHome from './useHome';

const DynamicScrollToTop = dynamic(
  () => import('~/components/ScrollToTop').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => null,
  }
);

const DynamicFabMenu = dynamic(() => import('~/components/FabMenu').then((mod) => mod.default), {
  loading: () => null,
});

const DynamicPortfolioSection = dynamic(
  () => import('./components/PortfolioSection').then((mod) => mod.default),
  {
    loading: () => <Box sx={{ minHeight: '100vh' }} />,
  }
);

interface AboutDialogContentProps {
  contentParagraphs: string[];
  title: string;
  onClose: () => void;
}

export interface HomeProps {
  ipAddress: string;
}

const AboutDialogContent: FC<AboutDialogContentProps> = memo(
  ({ contentParagraphs, title, onClose }) => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 4 },
        backgroundColor: 'background.paper',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <DialogTitle
          id="about-dialog-title"
          sx={{
            p: 0,
            fontSize: { xs: '1.75rem', sm: '2rem' },
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {title}
        </DialogTitle>
        <IconButton
          aria-label="close dialog"
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            p: 1,
            '&:hover': {
              color: 'text.primary',
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent
        sx={{
          p: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        <Box
          id="about-dialog-description"
          component="article"
          sx={{
            color: 'text.primary',
            '& > p': {
              mb: 2,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              '&:last-child': {
                mb: 0,
              },
            },
          }}
        >
          {contentParagraphs?.map((paragraph: string, index: number) => (
            <Typography
              key={`paragraph-${index}`}
              component="p"
              sx={{
                textAlign: 'justify',
                hyphens: 'auto',
              }}
            >
              {paragraph}
            </Typography>
          ))}
        </Box>
      </DialogContent>
    </Paper>
  )
);

AboutDialogContent.displayName = 'AboutDialogContent';

const Home: FC<HomeProps> = memo(({ ipAddress }) => {
  const { data, methods } = useHome({ ipAddress });
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const contentParagraphs: string[] = useMemo(
    () =>
      data?.aboutLocale?.content?.replace('{years}', data.yearsOfExperience || '').split('\n\n') ??
      [],
    [data?.aboutLocale?.content, data.yearsOfExperience]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && data.openAboutDialog) {
        methods.handleAboutDialog();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.openAboutDialog, methods.handleAboutDialog]
  );

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: '20px' },
            m: { xs: 0, sm: 2 },
            width: { sm: '600px' },
            height: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' },
          },
        }}
        open={data.openAboutDialog}
        onClose={methods.handleAboutDialog}
        aria-labelledby="about-dialog-title"
        aria-describedby="about-dialog-description"
        onKeyDown={handleKeyPress}
      >
        <AboutDialogContent
          contentParagraphs={contentParagraphs}
          title={data?.aboutLocale?.title ?? ''}
          onClose={methods.handleAboutDialog}
        />
      </Dialog>

      <main>
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
          role="status"
          aria-live="polite"
        >
          {data.typedWord.length > 0 ? `${data?.homeLocale?.you}${data.typedWord.join('')}` : ''}
        </Box>

        <Box
          component="section"
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
            aria-label="Open about me dialog"
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
              role="presentation"
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
              alt="Afriyadi Y. R.'s profile picture"
              priority
              quality={90}
              loading="eager"
              sizes="200px"
            />
          </Button>
          <Typography
            variant="h1"
            component="h1"
            color="white"
            gutterBottom
            sx={{
              mt: 2,
              fontWeight: 500,
              letterSpacing: 0.5,
              fontSize: { xs: '2rem', sm: '2.25rem' },
            }}
          >
            afriyadi y. r.
          </Typography>
        </Box>
        <DynamicFabMenu />
        <DynamicPortfolioSection />
      </main>
    </>
  );
});

Home.displayName = 'Home';

export default Home;
