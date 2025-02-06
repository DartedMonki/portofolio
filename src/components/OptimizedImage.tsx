/* eslint-disable jsx-a11y/alt-text */
import Image, { ImageProps } from 'next/image';
import { memo, useMemo } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  quality?: number;
}

const OptimizedImage = ({ src, ...props }: OptimizedImageProps) => {
  const optimizedSrc = useMemo(() => {
    // Skip for external URLs
    if (src.startsWith('http')) return src;

    // Transform the path from /images/example.png to /images/optimized/example
    const pathMatch = RegExp(/^\/images\/(.+)\.(png|jpe?g|gif|webp)$/i).exec(src);
    if (!pathMatch) return src;

    const [, imageName] = pathMatch;

    // Get the appropriate size suffix based on the image width
    const getSize = () => {
      const width = Number(props.width ?? 0);
      if (width <= 256) return 'sm';
      if (width <= 480) return 'md';
      return 'lg';
    };

    // Use avif as it's higher quality
    return `/images/optimized/${imageName}-${getSize()}.avif`;
  }, [src, props.width]);

  const { width, ...omittedProps } = props;

  return <Image {...omittedProps} src={optimizedSrc} blurDataURL={src} placeholder="blur" />;
};

export default memo(OptimizedImage);
