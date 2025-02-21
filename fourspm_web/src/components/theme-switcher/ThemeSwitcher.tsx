import React, { useCallback, useContext } from 'react';
import Button from 'devextreme-react/button';
import { ThemeContext } from '../../theme/theme';
import './theme-switcher.scss';

export const ThemeSwitcher = () => {
  const themeContext = useContext(ThemeContext);

  const onButtonClick = useCallback(() => {
    themeContext?.switchTheme();
  }, [themeContext]);

  return (
    <div className="theme-switcher">
      <Button
        className={`theme-button dx-theme-${themeContext?.theme}-mode`}
        stylingMode="text"
        onClick={onButtonClick}
      >
        <i className={`dx-icon theme-icon ${themeContext?.theme !== 'dark' ? 'dark-icon' : 'light-icon'}`} />
      </Button>
    </div>
  );
};
