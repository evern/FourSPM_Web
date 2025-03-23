import React, { useMemo, ReactElement } from 'react';
import { useHistory } from "react-router-dom";
import ContextMenu, { Position } from 'devextreme-react/context-menu';
import List from 'devextreme-react/list';
import { useAuth } from '../../contexts/auth';
import './user-panel.scss';

interface Props {
  menuMode: 'context' | 'list';
}

export default function UserPanel({ menuMode }: Props): ReactElement {
  const { user, signOut } = useAuth();
  const history = useHistory();

  const menuItems = useMemo(() => {
    const navigateToProfile = () => {
      history.push("/profile");
    };

    return [
      {
        text: 'Profile',
        icon: 'user',
        onClick: navigateToProfile
      },
      {
        text: 'Logout',
        icon: 'runner',
        onClick: signOut
      }
    ];
  }, [history, signOut]);

  if (!user) {
    return <div className="user-panel">Loading...</div>;
  }

  return (
    <div className={'user-panel'}>
      <div className={'user-info'}>
        <div className={'image-container'}>
          <div
            style={{
              background: `url(${user.avatarUrl || ''}) no-repeat #fff`,
              backgroundSize: 'cover'
            }}
            className={'user-image'} />
        </div>
        <div className={'user-name'}>{user.email || 'Anonymous'}</div>
      </div>

      {menuMode === 'context' && (
        <ContextMenu
          items={menuItems}
          target={'.user-button'}
          showEvent={'dxclick'}
          width={210}
          cssClass={'user-menu'}
        >
          <Position my={'top center'} at={'bottom center'} />
        </ContextMenu>
      )}
      {menuMode === 'list' && (
        <div className="user-panel-list-wrapper">
          <List
            items={menuItems}
            className={'dx-toolbar-menu-action'}
          />
        </div>
      )}
    </div>
  );
}
