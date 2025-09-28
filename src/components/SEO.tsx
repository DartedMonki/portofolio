import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    siteName?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
  };
}

const defaultSEO = {
  title: 'Afriyadi Y. R. - Software Engineer',
  description:
    'Software engineer with experience in React.js, Next.js, Vue.js, Spring, Go, Laravel, Flutter, React Native, and more. View my projects and get in touch.',
  openGraph: {
    type: 'website',
    image: 'https://avatars.githubusercontent.com/u/12370632?v=4',
    siteName: 'Afriyadi Y. R.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function SEO({
  title = defaultSEO.title,
  description = defaultSEO.description,
  openGraph = defaultSEO.openGraph,
  twitter = defaultSEO.twitter,
}: Readonly<SEOProps>) {
  const router = useRouter();
  const fullUrl = `https://dartedmonki.com${router.asPath}`;
  const ogImage = openGraph.image || defaultSEO.openGraph.image;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph / Facebook */}
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={openGraph.type} />
      <meta property="og:title" content={openGraph.title || title} />
      <meta property="og:description" content={openGraph.description || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={openGraph.siteName || defaultSEO.openGraph.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitter.card} />
      <meta name="twitter:site" content={twitter.site} />
      <meta name="twitter:creator" content={twitter.creator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Afriyadi Y. R." />
      <link rel="canonical" href={fullUrl} />
      <link rel="preconnect" href="https://avatars.githubusercontent.com" />
    </Head>
  );
}
