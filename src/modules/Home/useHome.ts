import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { isEmpty } from '~/utils/lang';

const useHome = () => {
  const [openAboutDialog, setOpenAboutDialog] = useState(false);
  const [typedWord, setTypedWord] = useState<string[]>([]);
  const objRef = useRef(null) as unknown as MutableRefObject<HTMLDivElement>;

  const handleAboutDialog = () => {
    setOpenAboutDialog((prev) => !prev);
  };

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
        setTypedWord((prev) => {
          return prev.slice(0, prev.length - 1);
        });
      }
    };

    document.addEventListener('mousemove', handleMoveObjectOnMouseMove);
    document.addEventListener('keydown', handleUserType, false);
    return () => {
      document.removeEventListener('mousemove', handleMoveObjectOnMouseMove);
      document.removeEventListener('keydown', handleUserType);
    };
  }, []);

  return {
    data: { objRef, openAboutDialog, typedWord },
    methods: { handleAboutDialog },
  };
};

export default useHome;
