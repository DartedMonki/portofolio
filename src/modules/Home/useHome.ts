import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import about from '~/src/locale/about';
import alert from '~/src/locale/alert';
import home from '~/src/locale/home';
import useLocale from '~/src/locale/useLocale';
import { mapTypedWordToUrl } from '~/src/utils/generateUrl';
import { isEmpty } from '~/utils/lang';

import type { HomeProps } from '.';

export interface About {
  title: string;
  content: string;
  avatar: string;
}

export interface Home {
  you: string;
}

interface UseHomeReturn {
  data: {
    aboutLocale: About;
    homeLocale: Home;
    objRef: MutableRefObject<HTMLDivElement>;
    openAboutDialog: boolean;
    typedWord: string[];
    yearsOfExperience: string;
  };
  methods: {
    handleAboutDialog: () => void;
  };
}

const useHome = ({ ipAddress }: HomeProps): UseHomeReturn => {
  const [openAboutDialog, setOpenAboutDialog] = useState<boolean>(false);
  const [typedWord, setTypedWord] = useState<string[]>([]);

  const objRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement>;

  const { enqueueSnackbar } = useSnackbar();
  const alertLocale = useLocale(alert);
  const aboutLocale = useLocale(about);
  const homeLocale = useLocale(home);

  const yearsOfExperience = useMemo(() => {
    const startWorkDate = dayjs('2020-11-09');
    return dayjs().diff(startWorkDate, 'year', true).toFixed(1);
  }, []);

  const handleAboutDialog = useCallback(() => {
    setOpenAboutDialog((prev) => !prev);
  }, []);

  const handleUserType = useCallback(
    (e: KeyboardEvent) => {
      const { key: name, keyCode: code } = e;

      if ((code > 64 && code < 91) || code === 32) {
        setTypedWord((prev) => [...prev, name]);
      } else if (code === 8) {
        setTypedWord((prev) => prev.slice(0, prev.length - 1));
      } else if (name === 'Enter') {
        const url = mapTypedWordToUrl?.[typedWord.join('')];
        if (url) {
          window.open(url, '_blank')?.focus();
          setTypedWord([]);
          return;
        }
        setTypedWord([]);
        enqueueSnackbar(alertLocale?.mouseMessage?.replace('{ipAddress}', ipAddress), {
          variant: 'success',
          autoHideDuration: 2500,
        });
      }
    },
    [alertLocale?.mouseMessage, enqueueSnackbar, ipAddress, typedWord]
  );

  const handleMoveObjectOnMouseMove = useCallback((e: MouseEvent) => {
    const element = objRef.current;
    if (!isEmpty(element)) {
      element.style.display = 'block';
      element.style.left = `${e.pageX + 15}px`;
      element.style.top = `${e.pageY + 15}px`;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMoveObjectOnMouseMove);
    document.addEventListener('keydown', handleUserType, false);

    return () => {
      document.removeEventListener('mousemove', handleMoveObjectOnMouseMove);
      document.removeEventListener('keydown', handleUserType);
    };
  }, [handleMoveObjectOnMouseMove, handleUserType]);

  return {
    data: {
      aboutLocale,
      homeLocale,
      objRef,
      openAboutDialog,
      typedWord,
      yearsOfExperience,
    },
    methods: {
      handleAboutDialog,
    },
  };
};

export default useHome;
