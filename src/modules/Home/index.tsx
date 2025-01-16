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
import { memo, useCallback } from 'react';

import FabMenu from '~/components/FabMenu';

import PortfolioSection from './portfolio-section';
import useHome from './useHome';

const DynamicScrollToTop = dynamic(() => import('~/src/components/ScrollToTop'), {
  ssr: false,
  loading: () => null,
});

const AboutDialogContent = memo(
  ({
    contentParagraphs,
    title,
    onClose,
  }: {
    contentParagraphs: string[];
    title: string;
    onClose: () => void;
  }) => (
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

export interface HomeProps {
  ipAddress: string;
}

const Home = ({ ipAddress }: HomeProps) => {
  const { data, methods } = useHome({ ipAddress });
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Split content into paragraphs with proper typing
  const contentParagraphs: string[] =
    data?.aboutLocale?.content?.replace('{years}', data.yearsOfExperience || '').split('\n\n') ??
    [];

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
            />
          </Button>
          <Typography
            variant="h4"
            component="h1"
            color="white"
            gutterBottom
            sx={{
              mt: 2,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            afriyadi y. r.
          </Typography>
        </Box>
        <FabMenu />
        <PortfolioSection />
      </main>
    </>
  );
};

export default memo(Home);
