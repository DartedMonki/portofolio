import { useRef } from 'react';

import { CacheProvider, EmotionCache } from '@emotion/react';
import { Cancel as CancelIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import { Didact_Gothic } from 'next/font/google';
import Head from 'next/head';
import { SnackbarProvider } from 'notistack';

import createEmotionCache from '~/utils/createEmotionCache';
import theme from '~/utils/theme';

import '~/utils/global.css';

const didactGothic = Didact_Gothic({
  weight: ['400'],
  subsets: ['latin'],
});
// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const snackbarRef = useRef(null) as any;

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${didactGothic.style.fontFamily};
        }
      `}</style>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>Portofolio</title>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <link rel="shortcut icon" href="/images/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/images/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="512x512"
            href="/images/android-chrome-512x512.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="192x192"
            href="/images/android-chrome-192x192.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/images/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/images/favicon-16x16.png"
          />
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <SnackbarProvider
            ref={snackbarRef}
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            action={(snackbarId) => (
              <IconButton
                onClick={() => snackbarRef.current.closeSnackbar(snackbarId)}
              >
                <CancelIcon htmlColor="white" />
              </IconButton>
            )}
          >
            <Component {...pageProps} />
          </SnackbarProvider>
        </ThemeProvider>
      </CacheProvider>
    </>
  );
}
