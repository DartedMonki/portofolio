import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from 'next';

import Home from '~/modules/Home';

const Index: NextPage = ({
  ipAddress,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <Home ipAddress={ipAddress} />
);

export default Index;

export const getServerSideProps: GetServerSideProps = async (context) => {
  let ipAddress;

  const { req } = context;

  if (req.headers['x-forwarded-for']) {
    ipAddress = (req.headers['x-forwarded-for'] as string).split(',')[0];
  } else if (req.headers['x-real-ip']) {
    ipAddress = req.connection.remoteAddress;
  } else {
    ipAddress = req.connection.remoteAddress;
  }

  return {
    props: {
      ipAddress,
    },
  };
};
