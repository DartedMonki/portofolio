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
    'Software engineer with experience in React.js, Next.js, Vue.js, Spring, Go, Laravel, Flutter, and more. View my projects and get in touch.',
  openGraph: {
    type: 'website',
    image: 'https://avatars.githubusercontent.com/u/12370632?v=4',
  },
};

export default function SEO({
  title = defaultSEO.title,
  description = defaultSEO.description,
  openGraph = defaultSEO.openGraph,
}: Readonly<SEOProps>) {
  const router = useRouter();
  const fullUrl = `https://dartedmonki.com${router.asPath}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={openGraph.title || title} />
      <meta property="og:description" content={openGraph.description || description} />
      <meta property="og:type" content={openGraph.type} />
      <meta property="og:image" content={openGraph.image} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />
      <link rel="preconnect" href="https://avatars.githubusercontent.com" />
    </Head>
  );
}
