import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';

import about from '~/src/locale/about';
import alert from '~/src/locale/alert';
import home from '~/src/locale/home';
import useLocale from '~/src/locale/useLocale';
import { mapTypedWordToUrl } from '~/src/utils/generateUrl';
import { isEmpty } from '~/utils/lang';

import { HomeProps } from '.';

const useHome = ({ ipAddress }: HomeProps) => {
  const [openAboutDialog, setOpenAboutDialog] = useState(false);
  const [typedWord, setTypedWord] = useState<string[]>([]);
  const objRef = useRef(null) as unknown as MutableRefObject<HTMLDivElement>;

  const { enqueueSnackbar } = useSnackbar();
  const alertLocale = useLocale(alert);
  const aboutLocale = useLocale(about);
  const homeLocale = useLocale(home);

  const handleAboutDialog = () => {
    setOpenAboutDialog((prev) => !prev);
  };

  const yearsOfExperience = useMemo(() => {
    const startWorkDate = dayjs('2020-11-09');
    return dayjs().diff(startWorkDate, 'year', true).toFixed(1);
  }, []);

  useEffect(() => {
    const element = objRef.current;

    const handleMoveObjectOnMouseMove = (e: MouseEvent) => {
      if (!isEmpty(element)) {
        element.style.display = 'block';
        element.style.left = `${e.pageX + 15}px`;
        element.style.top = `${e.pageY + 15}px`;
      }
    };

    const handleUserType = (e: KeyboardEvent) => {
      const name = e.key;
      const code = e.keyCode;
      if ((code > 64 && code < 91) || code === 32) {
        setTypedWord((prev) => [...prev, name]);
      } else if (code == 8) {
        setTypedWord((prev) => prev.slice(0, prev.length - 1));
      } else if (name === 'Enter') {
        const url = mapTypedWordToUrl?.[typedWord.join('')];
        if (url) {
          window.open(url, '_blank')?.focus();
          setTypedWord([]);
          return;
        }
        setTypedWord([]);
        enqueueSnackbar(
          alertLocale?.mouseMessage?.replace('{ipAddress}', ipAddress),
          {
            variant: 'success',
            autoHideDuration: 2500,
          },
        );
      }
    };

    document.addEventListener('mousemove', handleMoveObjectOnMouseMove);
    document.addEventListener('keydown', handleUserType, false);
    return () => {
      document.removeEventListener('mousemove', handleMoveObjectOnMouseMove);
      document.removeEventListener('keydown', handleUserType);
    };
  }, [alertLocale?.mouseMessage, enqueueSnackbar, ipAddress, typedWord]);

  return {
    data: {
      aboutLocale,
      homeLocale,
      objRef,
      openAboutDialog,
      typedWord,
      yearsOfExperience,
    },
    methods: { handleAboutDialog },
  };
};

export default useHome;
