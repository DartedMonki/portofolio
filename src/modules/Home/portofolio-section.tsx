import { GitHub as GitHubIcon } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import Image from 'next/image';
import { EffectCards } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/effect-cards';
import BlackBorderButtonLink from '~/src/components/BlackBorderButtonLink';

import styles from './Home.module.css';

const PortfolioSection = () => {
  const isMobile = useMediaQuery('(max-width:767px)');
  const imgWidth = isMobile ? 256 : 640;
  const imgHeight = isMobile ? 144 : 360;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Castle Journey
        </Typography>
      </Box>
      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards]}
        className={styles.swiper}
      >
        <SwiperSlide>
          <Image
            src="/images/main-menu.png"
            width={imgWidth}
            height={imgHeight}
            alt="asd"
          />
        </SwiperSlide>
        <SwiperSlide>
          <Image
            src="/images/world-1.png"
            width={imgWidth}
            height={imgHeight}
            alt="asd"
          />
        </SwiperSlide>
        <SwiperSlide>
          <Image
            src="/images/world-2.png"
            width={imgWidth}
            height={imgHeight}
            alt="asd"
          />
        </SwiperSlide>
        <SwiperSlide>
          <Image
            src="/images/boss.png"
            width={imgWidth}
            height={imgHeight}
            alt="asd"
          />
        </SwiperSlide>
      </Swiper>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 3,
        }}
      >
        <BlackBorderButtonLink href="https://github.com/DartedMonki/castle-journey">
          <GitHubIcon sx={{ mr: 1 }} />
          Github Repository
        </BlackBorderButtonLink>
      </Box>
    </Box>
  );
};

export default PortfolioSection;
