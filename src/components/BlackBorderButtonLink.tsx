import * as React from 'react';

import { ButtonUnstyledProps } from '@mui/base/ButtonUnstyled';
import useButton from '@mui/base/useButton';
import { Link } from '@mui/material';
import { styled } from '@mui/system';
import { clsx } from 'clsx';
import { Didact_Gothic } from 'next/font/google';

const didactGothic = Didact_Gothic({
  weight: ['400'],
  subsets: ['latin'],
});

const BlackBorderButtonLink = React.forwardRef(function BlackBorderButtonLink(
  props: ButtonUnstyledProps,
  ref: React.ForwardedRef<any>,
) {
  const { children, href } = props;
  const { active, disabled, focusVisible, getRootProps } = useButton({
    ...props,
    ref,
  });

  const classes = {
    active,
    disabled,
    focusVisible,
  };

  return (
    <Link
      href={href}
      underline="none"
      target="_blank"
      rel="noreferrer noopener"
    >
      <BlackBorderButtonLinkRoot {...getRootProps()} className={clsx(classes)}>
        <span className="buttonChild">{children}</span>
      </BlackBorderButtonLinkRoot>
    </Link>
  );
});

export default BlackBorderButtonLink;

const black = '#000000';

const BlackBorderButtonLinkRoot = styled('button')`
  font-family: ${didactGothic.style.fontFamily};
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  border: none;
  border-radius: 0.75em;
  background: ${black};
  padding: 0;

  & .buttonChild {
    display: flex;
    box-sizing: border-box;
    border: 2px solid ${black};
    border-radius: 0.75em;
    padding: 0.75em 1.5em;
    background-color: #ffffff;
    color: ${black};
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
