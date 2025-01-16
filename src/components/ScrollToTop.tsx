import { KeyboardArrowUp } from '@mui/icons-material';
import { Box, Fab, useScrollTrigger, Zoom } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

const ScrollTop = () => {
  const useScrollTriggerRes = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(useScrollTriggerRes);
  }, [useScrollTriggerRes]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <Zoom in={show}>
      <Box
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 32,
          left: 32,
          zIndex: 99,
        }}
      >
        <Fab
          onClick={scrollToTop}
          size="small"
          aria-label="scroll-to-top"
          sx={{
            bgcolor: 'white',
            borderRadius: '50px',
            background: 'linear-gradient(145deg, #e6e6e6, #ffffff)',
            boxShadow: `20px 20px 60px #949494,
            -20px -20px 60px #ffffff`,
            ':hover': {
              bgcolor: 'white',
            },
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Box>
    </Zoom>
  );
};

export default ScrollTop;
