import 'swiper/css';
import 'swiper/css/effect-cards';

import { GitHub, Language } from '@mui/icons-material';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';
import { memo } from 'react';
import { EffectCards } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import BlackBorderButtonLink from '~/src/components/BlackBorderButtonLink';

import styles from './Home.module.css';

export interface ProjectImage {
  src: string;
  alt: string;
  priority?: boolean;
}

export interface Project {
  title: string;
  images: ProjectImage[];
  link: {
    href: string;
    text: string;
    icon: typeof GitHub | typeof Language; // Fixed the type here
  };
  isDark?: boolean;
}

export const PORTFOLIO_PROJECTS: Project[] = [
  {
    title: 'Castle Journey',
    images: [
      { src: '/images/main-menu.png', alt: 'Castle Journey Main Menu' },
      { src: '/images/world-1.png', alt: 'Castle Journey World 1' },
      { src: '/images/world-2.png', alt: 'Castle Journey World 2' },
      { src: '/images/boss.png', alt: 'Castle Journey Boss Battle' },
    ],
    link: {
      href: 'https://github.com/DartedMonki/castle-journey',
      text: 'Github Repository',
      icon: GitHub,
    },
  },
  {
    title: 'Wingbox',
    isDark: true,
    images: [
      { src: '/images/wingbox-home.png', alt: 'Wingbox Home Page', priority: true },
      { src: '/images/wingbox-calculator.png', alt: 'Wingbox Calculator Interface' },
      { src: '/images/wingbox-track.png', alt: 'Wingbox Tracking System' },
      { src: '/images/wingbox-about.png', alt: 'About Wingbox' },
      { src: '/images/wingbox-login.png', alt: 'Wingbox Login Page' },
    ],
    link: {
      href: 'https://wingbox.id',
      text: 'Website',
      icon: Language,
    },
  },
];

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = memo(({ project }: ProjectCardProps) => {
  const IconComponent = project.link.icon;

  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        backgroundColor: project.isDark ? 'black' : 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      aria-labelledby={`project-${project.title}`}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color={project.isDark ? 'white' : 'inherit'}
          id={`project-${project.title}`}
        >
          {project.title}
        </Typography>
      </Box>

      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards]}
        className={styles.swiper}
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
        }}
      >
        {project.images.map((image, index) => (
          <SwiperSlide key={image.src}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                backgroundColor: 'white',
              }}
              role="group"
              aria-label={`Slide ${index + 1} of ${project.images.length}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 767px) 256px, 640px"
                style={{
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                priority={image.priority}
                loading={image.priority ? 'eager' : 'lazy'}
              />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 3,
        }}
      >
        <BlackBorderButtonLink
          href={project.link.href}
          invert={project.isDark}
          aria-label={`Visit ${project.title} ${project.link.text}`}
        >
          <IconComponent sx={{ mr: 1 }} aria-hidden="true" />
          {project.link.text}
        </BlackBorderButtonLink>
      </Box>
    </Box>
  );
});

ProjectCard.displayName = 'ProjectCard';

const PortfolioSection = memo(() => (
  <Box component="main" role="main">
    {PORTFOLIO_PROJECTS.map((project) => (
      <ProjectCard key={project.title} project={project} />
    ))}
  </Box>
));

PortfolioSection.displayName = 'PortfolioSection';

export default PortfolioSection;
