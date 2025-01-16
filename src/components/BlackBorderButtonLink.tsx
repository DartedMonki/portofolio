import { ButtonUnstyledProps } from '@mui/base/ButtonUnstyled';
import useButton from '@mui/base/useButton';
import { Link } from '@mui/material';
import { styled } from '@mui/system';
import { clsx } from 'clsx';
import { Didact_Gothic } from 'next/font/google';
import * as React from 'react';

const didactGothic = Didact_Gothic({
  weight: ['400'],
  subsets: ['latin'],
});

interface BlackBorderButtonLinkProps extends ButtonUnstyledProps {
  invert?: boolean;
  href?: string;
}

const BlackBorderButtonLink = React.forwardRef(function BlackBorderButtonLink(
  props: BlackBorderButtonLinkProps,
  ref: React.ForwardedRef<any>
) {
  const { children, href, invert = false, ...otherProps } = props;
  const { active, disabled, focusVisible, getRootProps } = useButton({
    ...otherProps,
    ref,
  });

  const classes = {
    active,
    disabled,
    focusVisible,
    invert,
  };

  return (
    <Link href={href} underline="none" target="_blank" rel="noreferrer noopener">
      <BlackBorderButtonLinkRoot {...getRootProps()} className={clsx(classes)}>
        <span className="buttonChild">{children}</span>
      </BlackBorderButtonLinkRoot>
    </Link>
  );
});

const black = '#000000';
const white = '#ffffff';

const BlackBorderButtonLinkRoot = styled('button')`
  font-family: ${didactGothic.style.fontFamily};
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  border: none;
  border-radius: 0.75em;
  background: ${(props) => (props.className?.includes('invert') ? white : black)};
  padding: 0;

  & .buttonChild {
    display: flex;
    box-sizing: border-box;
    border: 2px solid ${(props) => (props.className?.includes('invert') ? white : black)};
    border-radius: 0.75em;
    padding: 0.75em 1.5em;
    background-color: ${(props) => (props.className?.includes('invert') ? black : white)};
    color: ${(props) => (props.className?.includes('invert') ? white : black)};
    transform: translateY(-0.2em);
    transition: transform 0.1s ease;
  }

  &:hover .buttonChild {
    /* Pull the button upwards when hovered */
    transform: translateY(-0.33em);
  }

  &:active .buttonChild {
    /* Push the button downwards when pressed */
    transform: translateY(0);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default BlackBorderButtonLink;
