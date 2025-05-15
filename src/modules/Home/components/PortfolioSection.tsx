import 'swiper/css';
import 'swiper/css/effect-cards';

import { GitHub, Language } from '@mui/icons-material';
import { CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { memo, useEffect, useState } from 'react';
import { EffectCards, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import BlackBorderButtonLink from '~/src/components/BlackBorderButtonLink';
import OptimizedImage from '~/src/components/OptimizedImage';

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
    title: 'Wingbox',
    technologies: ['Next.js', 'Fiber (Go)', 'PostgreSQL'],
    isDark: false,
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
    title: 'Pura Pura Bike',
    technologies: ['Next.js', 'Tailwind CSS'],
    isDark: true,
    images: [
      { src: '/images/pura-pura-bike-1.png', alt: 'Pura Pura Bike Hero', priority: true },
      { src: '/images/pura-pura-bike-2.png', alt: 'Pura Pura Bike Kegiatan Rutin' },
      { src: '/images/pura-pura-bike-3.png', alt: 'Pura Pura Bike Kolaborator' },
      { src: '/images/pura-pura-bike-4.png', alt: 'Pura Pura Bike Statistik Kami' },
      { src: '/images/pura-pura-bike-5.png', alt: 'Pura Pura Bike Hubungi Kami' },
    ],
    link: {
      href: 'https://pura-pura-bike.vercel.app/',
      text: 'Website',
      icon: Language,
    },
  },
  {
    title: 'Intermedia Prima Vision',
    technologies: ['Javascript', 'HTML', 'Tailwind CSS'],
    isDark: false,
    images: [
      { src: '/images/ipvision.png', alt: 'Intermedia Prima Vision Home Page', priority: true },
    ],
    link: {
      href: 'https://ipvision.id/',
      text: 'Website',
      icon: Language,
    },
  },
  {
    title: 'Heetung',
    technologies: ['Flutter', 'Dart'],
    isDark: true,
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
    isDark: false,
    images: [
      { src: '/images/sembunyi-social-1.png', alt: 'Sembunyi Social Main Screen', priority: true },
      { src: '/images/sembunyi-social-2.png', alt: 'Sembunyi Social Direct Message Screen' },
      { src: '/images/sembunyi-social-3.png', alt: 'Sembunyi Social Notification Screen' },
      { src: '/images/sembunyi-social-4.png', alt: 'Sembunyi Social Settings Screen' },
    ],
  },
  {
    title: 'Castle Journey',
    technologies: ['Unity', 'C#'],
    isDark: true,
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

const ProjectHeader = memo(
  ({
    title,
    technologies,
    isDark,
  }: {
    title: string;
    technologies: string[];
    isDark?: boolean;
  }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: 3,
      }}
    >
      <Typography variant="h4" fontWeight="bold" color={isDark ? 'white' : 'inherit'}>
        {title}
      </Typography>
      <Typography
        variant="subtitle1"
        color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
        sx={{ mt: 1 }}
      >
        {technologies.join(' • ')}
      </Typography>
    </Box>
  )
);

ProjectHeader.displayName = 'ProjectHeader';

const ProjectLink = memo(
  ({ link, isDark, title }: { link?: ProjectLink; isDark?: boolean; title: string }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        my: 3,
      }}
    >
      {link && (
        <BlackBorderButtonLink
          href={link.href}
          invert={isDark}
          aria-label={`Visit ${title} ${link.text}`}
        >
          <link.icon sx={{ mr: 1 }} aria-hidden="true" />
          {link.text}
        </BlackBorderButtonLink>
      )}
    </Box>
  )
);

ProjectLink.displayName = 'ProjectLink';

const LoadingProjectCard = memo(
  ({ project, isMobile }: { project: Project; isMobile: boolean }) => (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        backgroundColor: project.isDark ? 'black' : 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ProjectHeader
        title={project.title}
        technologies={project.technologies}
        isDark={project.isDark}
      />
      <Box
        sx={{
          width: isMobile ? '256px' : '640px',
          height: isMobile ? '144px' : '360px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '12px 18px 34px -16px rgba(66, 68, 90, 1)',
        }}
      >
        <CircularProgress
          sx={{
            color: project.isDark ? 'white' : 'primary.main',
          }}
        />
      </Box>
      <ProjectLink link={project.link} isDark={project.isDark} title={project.title} />
    </Box>
  )
);

LoadingProjectCard.displayName = 'LoadingProjectCard';

const ProjectSlides = memo(
  ({
    project,
    dimensions,
    isMobile,
  }: {
    project: Project;
    dimensions: AspectRatioStyle;
    isMobile: boolean;
  }) => {
    const [isSSR, setIsSSR] = useState(true);

    useEffect(() => {
      setIsSSR(false);
    }, []);

    if (isSSR) {
      return null;
    }

    return (
      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards, Virtual]}
        className={styles.swiper}
        style={{
          ...dimensions,
          marginLeft: 'auto',
          marginRight: 'auto',
          willChange: 'transform',
        }}
        watchSlidesProgress={true}
        speed={600}
        resistance={true}
        resistanceRatio={0.85}
      >
        {project.images.map((image, index) => (
          <SwiperSlide key={image.src}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                overflow: 'hidden',
                transform: 'translate3d(0, 0, 0)',
              }}
              role="group"
              aria-label={`Slide ${index + 1} of ${project.images.length}`}
            >
              <OptimizedImage
                key={`${image.src}-${index}`}
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 1024px) 480px, 640px"
                style={{
                  objectFit: 'contain',
                }}
                width={isMobile ? 480 : 640}
                loading={index === 0 ? 'eager' : 'lazy'}
                onLoad={(event) => {
                  event.currentTarget.classList.add('loaded');
                }}
              />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }
);

ProjectSlides.displayName = 'ProjectSlides';

const ProjectCard = memo(({ project }: ProjectCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dimensions, setDimensions] = useState<AspectRatioStyle | null>(null);

  useEffect(() => {
    let mounted = true;
    const calculateDimensions = async () => {
      if (!project.images[0]) return;
      try {
        const { width, height } = await getImageDimensions(project.images[0].src);
        if (mounted) {
          setDimensions(calculateAspectRatioStyle(width, height, isMobile));
        }
        // eslint-disable-next-line no-empty
      } catch (_error) {}
    };

    calculateDimensions();
    return () => {
      mounted = false;
    };
  }, [project.images, isMobile]);

  if (!dimensions) {
    return <LoadingProjectCard project={project} isMobile={isMobile} />;
  }

  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        maxWidth: '100vw',
        overflowX: 'hidden',
        backgroundColor: project.isDark ? 'black' : 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      aria-labelledby={`project-${project.title}`}
    >
      <ProjectHeader
        title={project.title}
        technologies={project.technologies}
        isDark={project.isDark}
      />
      <ProjectSlides project={project} dimensions={dimensions} isMobile={isMobile} />
      <ProjectLink link={project.link} isDark={project.isDark} title={project.title} />
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
