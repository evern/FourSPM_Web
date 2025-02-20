import { useState, useCallback } from 'react';
import { useScreenSize } from './media-query';

type MenuPatchReturnType = [string, () => void];

export function useMenuPatch(): MenuPatchReturnType {
  const { isSmall, isMedium } = useScreenSize();
  const [enabled, setEnabled] = useState<boolean>(isSmall || isMedium);
  
  const onMenuReady = useCallback((): void => {
    if (!enabled) {
      return;
    }

    setTimeout(() => setEnabled(false));
  }, [enabled]);

  return [enabled ? 'pre-init-blink-fix' : '', onMenuReady];
}
