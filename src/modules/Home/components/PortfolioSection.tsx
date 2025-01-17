import 'swiper/css';
import 'swiper/css/effect-cards';

import { GitHub, Language } from '@mui/icons-material';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';
import { memo, useEffect, useState } from 'react';
import { EffectCards } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import BlackBorderButtonLink from '~/src/components/BlackBorderButtonLink';

import styles from '../Home.module.css';

export interface ProjectImage {
  src: string;
  alt: string;
  priority?: boolean;
}

export interface ProjectLink {
  href: string;
  text: string;
  icon: typeof GitHub | typeof Language;
}

export interface Project {
  title: string;
  technologies: string[];
  images: ProjectImage[];
  link?: ProjectLink;
  isDark?: boolean;
}

export const PORTFOLIO_PROJECTS: Project[] = [
  {
    title: 'Castle Journey',
    technologies: ['Unity', 'C#'],
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
    technologies: ['Next.js', 'Fiber (Go)', 'PostgreSQL'],
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
  {
    title: 'Heetung',
    technologies: ['Flutter', 'Dart'],
    isDark: false,
    images: [
      { src: '/images/heetung-1.png', alt: 'Heetung Main Screen', priority: true },
      { src: '/images/heetung-2.png', alt: 'Heetung Settings Screen' },
      { src: '/images/heetung-3.png', alt: 'Heetung Subcounter Dialog' },
      { src: '/images/heetung-4.png', alt: 'Heetung Main Screen With Subcounter' },
      { src: '/images/heetung-5.png', alt: 'Heetung Main Screen Dark' },
    ],
  },
  {
    title: 'Sembunyi Social',
    technologies: ['Flutter', 'Dart'],
    isDark: true,
    images: [
      { src: '/images/sembunyi-social-1.png', alt: 'Sembunyi Social Main Screen', priority: true },
      { src: '/images/sembunyi-social-2.png', alt: 'Sembunyi Social Direct Message Screen' },
      { src: '/images/sembunyi-social-3.png', alt: 'Sembunyi Social Notification Screen' },
      { src: '/images/sembunyi-social-4.png', alt: 'Sembunyi Social Settings Screen' },
    ],
  },
];

interface AspectRatioStyle {
  width: string;
  height: string;
}

interface ProjectCardProps {
  project: Project;
}

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = window.document.createElement('img');
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = src;
  });

const calculateAspectRatioStyle = (
  width: number,
  height: number,
  isMobile: boolean
): AspectRatioStyle => {
  const aspectRatio = width / height;
  const isSquarish = Math.abs(aspectRatio - 1) < 0.1; // Consider ratios close to 1 as square

  if (isMobile) {
    if (isSquarish) {
      return { width: '256px', height: '256px' };
    }
    return { width: '256px', height: `${Math.round(256 / aspectRatio)}px` };
  }

  // Desktop
  if (isSquarish) {
    return { width: '480px', height: '480px' };
  }
  if (aspectRatio > 1) {
    return { width: '640px', height: `${Math.round(640 / aspectRatio)}px` };
  }
  return { width: `${Math.round(640 * aspectRatio)}px`, height: '640px' };
};

const ProjectCard = memo(({ project }: ProjectCardProps) => {
  const [dimensions, setDimensions] = useState<AspectRatioStyle | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    // Get dimensions of the first image
    if (project.images[0]) {
      getImageDimensions(project.images[0].src).then(({ width, height }) => {
        setDimensions(calculateAspectRatioStyle(width, height, window.innerWidth < 768));
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [project.images]);

  // Update dimensions when screen size changes
  useEffect(() => {
    if (project.images[0]) {
      getImageDimensions(project.images[0].src).then(({ width, height }) => {
        setDimensions(calculateAspectRatioStyle(width, height, isMobile));
      });
    }
  }, [isMobile, project.images]);

  if (!dimensions) {
    return null; // or a loading state
  }

  const dynamicSwiperStyle = {
    ...dimensions,
    marginLeft: 'auto',
    marginRight: 'auto',
  };

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
          flexDirection: 'column',
          alignItems: 'center',
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
        <Typography
          variant="subtitle1"
          color={project.isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
          sx={{ mt: 1 }}
        >
          {project.technologies.join(' • ')}
        </Typography>
      </Box>

      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards]}
        className={styles.swiper}
        style={dynamicSwiperStyle}
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
                height: '100%',
                backgroundColor: 'white',
              }}
              role="group"
              aria-label={`Slide ${index + 1} of ${project.images.length}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={`(max-width: 767px) 256px, ${dimensions.width}`}
                style={{
                  objectFit: 'contain',
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
        {project.link && (
          <BlackBorderButtonLink
            href={project.link.href}
            invert={project.isDark}
            aria-label={`Visit ${project.title} ${project.link.text}`}
          >
            <project.link.icon sx={{ mr: 1 }} aria-hidden="true" />
            {project.link.text}
          </BlackBorderButtonLink>
        )}
      </Box>
    </Box>
  );
});

ProjectCard.displayName = 'ProjectCard';

const PortfolioSection = memo(() => (
  <Box component="main">
    {PORTFOLIO_PROJECTS.map((project) => (
      <ProjectCard key={project.title} project={project} />
    ))}
  </Box>
));

PortfolioSection.displayName = 'PortfolioSection';

export default PortfolioSection;
