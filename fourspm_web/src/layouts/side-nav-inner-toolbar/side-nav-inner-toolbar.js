import Button from 'devextreme-react/button';
import Drawer from 'devextreme-react/drawer';
import ScrollView from 'devextreme-react/scroll-view';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import React, { useState, useCallback, useRef } from 'react';
import { useHistory } from 'react-router';
import { Header, SideNavigationMenu, Footer } from '../../components';
import './side-nav-inner-toolbar.scss';
import { useScreenSize } from '../../utils/media-query';
import { useMenuPatch } from '../../utils/patches';

const MenuStatus = {
  Closed: 1,
  Opened: 2,
  TemporaryOpened: 3
};

export default function SideNavInnerToolbar({ title, children }) {
  const scrollViewRef = useRef();
  const history = useHistory();
  const { isXSmall, isLarge } = useScreenSize();
  const [patchCssClass, onMenuReady] = useMenuPatch();
  const [menuStatus, setMenuStatus] = useState(null);

  const getDefaultMenuStatus = useCallback(() => 
    isLarge ? MenuStatus.Opened : MenuStatus.Closed, [isLarge]);

  const getMenuStatus = useCallback((status) => {
    if (status === null) {
      return getDefaultMenuStatus();
    }
    return status;
  }, [getDefaultMenuStatus]);

  const updateMenuStatus = useCallback((status) => {
    return status === getDefaultMenuStatus() ? null : status;
  }, [getDefaultMenuStatus]);

  const changeMenuStatus = useCallback((reducerFn) => {
    setMenuStatus(prevMenuStatus => 
      updateMenuStatus(reducerFn(getMenuStatus(prevMenuStatus)) ?? prevMenuStatus));
  }, [getMenuStatus, updateMenuStatus]);

  const toggleMenu = useCallback(({ event }) => {
    changeMenuStatus(prevStatus => 
      prevStatus === MenuStatus.Closed ? MenuStatus.Opened : MenuStatus.Closed);
    event.stopPropagation();
  }, [changeMenuStatus]);

  const temporaryOpenMenu = useCallback(() => {
    changeMenuStatus(prevStatus => 
      prevStatus === MenuStatus.Closed ? MenuStatus.TemporaryOpened : null);
  }, [changeMenuStatus]);

  const onOutsideClick = useCallback(() => {
    changeMenuStatus(prevStatus => 
      prevStatus !== MenuStatus.Closed && !isLarge ? MenuStatus.Closed : null);
    return !isLarge;
  }, [isLarge, changeMenuStatus]);

  const onNavigationChanged = useCallback(({ itemData: { path }, event, node }) => {
    if (getMenuStatus(menuStatus) === MenuStatus.Closed || !path || node.selected) {
      event.preventDefault();
      return;
    }

    history.push(path);
    if (scrollViewRef.current) {
      scrollViewRef.current.instance.scrollTo(0);
    }

    if (!isLarge || menuStatus === MenuStatus.TemporaryOpened) {
      setMenuStatus(updateMenuStatus(MenuStatus.Closed));
      event.stopPropagation();
    }
  }, [history, menuStatus, isLarge, getMenuStatus, updateMenuStatus]);

  return (
    <div className={'side-nav-inner-toolbar'}>
      <Drawer
        className={['drawer', patchCssClass].join(' ')}
        position={'before'}
        closeOnOutsideClick={onOutsideClick}
        openedStateMode={isLarge ? 'shrink' : 'overlap'}
        revealMode={isXSmall ? 'slide' : 'expand'}
        minSize={isXSmall ? 0 : 60}
        maxSize={250}
        shading={isLarge ? false : true}
        opened={getMenuStatus(menuStatus) === MenuStatus.Closed ? false : true}
      >
        <div className={'container'}>
          <Header
            menuToggleEnabled={isXSmall}
            toggleMenu={toggleMenu}
            title={title}
          />
          <ScrollView ref={scrollViewRef} className={'layout-body with-footer'}>
            <div className={'content'}>
              {React.Children.map(children, item => {
                return item.type !== Footer && item;
              })}
            </div>
            <div className={'content-block'}>
              {React.Children.map(children, item => {
                return item.type === Footer && item;
              })}
            </div>
          </ScrollView>
        </div>
        <SideNavigationMenu
          compactMode={getMenuStatus(menuStatus) === MenuStatus.Closed}
          selectedItemChanged={onNavigationChanged}
          openMenu={temporaryOpenMenu}
          onMenuReady={onMenuReady}
        >
          <Toolbar id={'navigation-header'}>
            {
              !isXSmall &&
              <Item
                location={'before'}
                cssClass={'menu-button'}
              >
                <Button icon="menu" stylingMode="text" onClick={toggleMenu} />
              </Item>
            }
            <Item location={'before'} cssClass={'header-title'} text={title} />
          </Toolbar>
        </SideNavigationMenu>
      </Drawer>
    </div>
  );
}
