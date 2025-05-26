import React, { ReactElement } from 'react';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import UserPanel from '../user-panel/user-panel';
import './header.scss';
import { Template } from 'devextreme-react/core/template';
import logo from '@/assets/images/logo.avif';
import { ThemeSwitcher } from '../theme-switcher/ThemeSwitcher';

interface HeaderProps {
  menuToggleEnabled: boolean;
  title: string;
  toggleMenu: (e: any) => void;
  className?: string;
}

export default function Header({ 
  menuToggleEnabled, 
  title, 
  toggleMenu,
  className 
}: HeaderProps): ReactElement {
  return (
    <header className={`header-component ${className || ''}`}>
      <Toolbar className={'header-toolbar'}>
        <Item
          visible={menuToggleEnabled}
          location={'before'}
          widget={'dxButton'}
          cssClass={'menu-button'}
        >
          <Button icon="menu" stylingMode="text" onClick={toggleMenu} />
        </Item>
        <Item
          location={'before'}
          cssClass={'header-logo'}
        >
          <img src={logo} alt="SPM Logo" className="header-logo-image" />
        </Item>
        <Item
          location={'before'}
          cssClass={'header-title'}
          text={title}
          visible={!!title}
        />
        <Item location='after' locateInMenu='never'>
          <ThemeSwitcher />
        </Item>
        <Item
          location={'after'}
          locateInMenu={'auto'}
          menuItemTemplate={'userPanelTemplate'}
        >
          <Button
            className={'user-button authorization'}
            width={50}
            height={'100%'}
            stylingMode={'text'}
          >
            <UserPanel menuMode={'context'} />
          </Button>
        </Item>
        <Template name={'userPanelTemplate'}>
          <UserPanel menuMode={'list'} />
        </Template>
      </Toolbar>
    </header>
  );
}
