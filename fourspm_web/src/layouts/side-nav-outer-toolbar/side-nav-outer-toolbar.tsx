import Drawer from 'devextreme-react/drawer';
import React, { useState, useCallback, useRef, ReactElement, useEffect } from 'react';
import { useHistory } from 'react-router';
import { Header, SideNavigationMenu, Footer } from '../../components';
import './side-nav-outer-toolbar.scss';
import { useScreenSize } from '../../utils/media-query';
import { Template } from 'devextreme-react/core/template'; 
import { useMenuPatch } from '../../utils/patches';

enum MenuStatus {
  Closed = 1,
  Opened = 2,
  TemporaryOpened = 3
}

interface SideNavOuterToolbarProps {
  title: string;
  children?: ReactElement | ReactElement[];
}

interface NavigationChangedEvent {
  itemData: {
    path: string;
  };
  event: Event;
  node: {
    selected: boolean;
  };
}

interface ToggleMenuEvent {
  event: Event;
}

export default function SideNavOuterToolbar({ title, children }: SideNavOuterToolbarProps): ReactElement {
  const history = useHistory();
  const { isXSmall, isLarge } = useScreenSize();
  const [patchCssClass, onMenuReady] = useMenuPatch();
  const [menuStatus, setMenuStatus] = useState<MenuStatus>(
    isLarge ? MenuStatus.Opened : MenuStatus.Closed
  );

  // Close menu when screen becomes small and reopen when becomes large
  useEffect(() => {
    if (!isLarge) {
      setMenuStatus(MenuStatus.Closed);
    } else {
      setMenuStatus(MenuStatus.Opened);
    }
  }, [isLarge]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 960) { // Same breakpoint as isLarge in media-query.ts
        setMenuStatus(MenuStatus.Closed);
      } else {
        setMenuStatus(MenuStatus.Opened);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = useCallback(({ event }: ToggleMenuEvent) => {
    setMenuStatus(prevStatus => {
      return prevStatus === MenuStatus.Closed ? MenuStatus.Opened : MenuStatus.Closed;
    });
    
    event.stopPropagation();
  }, [menuStatus]);

  const temporaryOpenMenu = useCallback(() => {
    setMenuStatus(
      prevMenuStatus => prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.TemporaryOpened
        : prevMenuStatus
    );
  }, []);

  const onOutsideClick = useCallback(() => {
    setMenuStatus(
      prevMenuStatus => prevMenuStatus !== MenuStatus.Closed && !isLarge
        ? MenuStatus.Closed
        : prevMenuStatus
    );
    return !isLarge;
  }, [isLarge]);

  const onNavigationChanged = useCallback(({ itemData: { path }, event, node }: NavigationChangedEvent) => {
    if (!path || node.selected) {
      event.preventDefault();
      return;
    }

    history.push(path);

    if (!isLarge || menuStatus === MenuStatus.TemporaryOpened) {
      setMenuStatus(MenuStatus.Closed);
      event.stopPropagation();
    }
  }, [history, menuStatus, isLarge]);

  return (
    <div className={'side-nav-outer-toolbar'}>
      <Header
        className={'layout-header'}
        menuToggleEnabled={true}
        toggleMenu={toggleMenu}
        title={title}
      />
      <Drawer
        className={['drawer', patchCssClass].join(' ')}
        position={'before'}
        closeOnOutsideClick={onOutsideClick}
        openedStateMode={isLarge ? 'shrink' : 'overlap'}
        revealMode={isXSmall ? 'slide' : 'expand'}
        minSize={isXSmall ? 0 : 60}
        maxSize={400}
        shading={!isLarge}
        opened={menuStatus !== MenuStatus.Closed}
        template={'menu'}
        height="calc(100% - 56px)" // Adjust height to account for header
      >
        <div className={'container'}>
          <div className={'scroll-wrapper'}>
            {/* ScrollView removed from here - will be added at page level when needed */}
            <div className={'content'}>
              {React.Children.map(children, (item) => {
                return item && React.isValidElement(item) && item.type !== Footer && item;
              })}
            </div>
          </div>
          <div className={'footer-container'}>
            {React.Children.map(children, (item) => {
              return item && React.isValidElement(item) && item.type === Footer && item;
            })}
          </div>
        </div>
        <Template name={'menu'}>
          <SideNavigationMenu
            compactMode={menuStatus === MenuStatus.Closed}
            selectedItemChanged={onNavigationChanged}
            openMenu={temporaryOpenMenu}
            onMenuReady={onMenuReady}
          />
        </Template>
      </Drawer>
    </div>
  );
}
