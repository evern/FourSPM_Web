import { useMemo, ReactElement, useState, useCallback } from 'react';
import { useHistory } from "react-router-dom";
import ContextMenu, { Position } from 'devextreme-react/context-menu';
import List from 'devextreme-react/list';
import { useMSALAuth } from '../../contexts/msal-auth';
import LoadIndicator from 'devextreme-react/load-indicator';
import Popup from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import './user-panel.scss';

interface Props {
  menuMode: 'context' | 'list';
}


function generateAvatarColor(name: string): string {

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = ((hash >> (i * 8)) & 0xFF) % 70 + 150;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}


function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function UserPanel({ menuMode }: Props): ReactElement {
  const { user, signOut } = useMSALAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutClick = useCallback(() => {
    setConfirmLogout(true);
  }, []);

  const handleConfirmedLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut();

      notify({
        message: 'Successfully signed out',
        width: 300,
        type: 'success',
        displayTime: 2000,
        position: { at: 'top center', my: 'top center' }
      });
    } catch (error) {
      notify({
        message: 'Logout failed. Please try again.',
        width: 300,
        type: 'error',
        displayTime: 3500,
        position: { at: 'top center', my: 'top center' }
      });
      console.error('Logout error:', error);
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  const menuItems = useMemo(() => {
    return [
      {
        text: user?.email || 'User',
        disabled: true,
        icon: 'user',
        cssClass: 'user-email-item'
      },
      {
        text: 'Logout',
        icon: 'runner',
        onClick: handleLogoutClick
      }
    ];
  }, [handleLogoutClick, user?.email]);

  if (!user) {
    return (
      <div className="user-panel">
        <LoadIndicator visible={true} width={20} height={20} />
      </div>
    );
  }


  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarColor = generateAvatarColor(userName);
  const initials = getInitials(userName);

  const avatar = user?.avatarUrl ? (
    <div
      style={{
        background: `url(${user.avatarUrl}) no-repeat #fff`,
        backgroundSize: 'cover'
      }}
      className={'user-image'}
    />
  ) : (
    <div
      style={{
        backgroundColor: avatarColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '16px'
      }}
      className={'user-image'}
    >
      {initials}
    </div>
  );

  return (
    <div className={'user-panel'}>
      <div className={'user-info'}>
        <div className={'image-container'}>
          {avatar}
        </div>
        <div className={'user-name'}>
          {user.name || user.email || 'Anonymous'}
        </div>
      </div>

      {menuMode === 'context' && (
        <ContextMenu
          items={menuItems}
          target={'.user-button'}
          showEvent={'dxclick'}
          width={120}
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

      <Popup
        visible={confirmLogout}
        dragEnabled={false}
        closeOnOutsideClick={!loggingOut}
        showCloseButton={!loggingOut}
        showTitle={true}
        title="Sign Out"
        onHiding={() => !loggingOut && setConfirmLogout(false)}
        width={400}
        height={250}
        className="logout-popup"
      >
        <div className="logout-popup-content">
          {loggingOut ? (
            <div className="logout-loading">
              <LoadIndicator visible={true} width={40} height={40} />
              <div className="loading-text">Signing out...</div>
            </div>
          ) : (
            <>
              <p className="logout-message">Are you sure you want to sign out?</p>
              <div className="logout-popup-buttons">
                <Button
                  text="Yes"
                  type="default"
                  onClick={handleConfirmedLogout}
                  width={100}
                />
                <Button
                  text="No"
                  type="normal"
                  onClick={() => setConfirmLogout(false)}
                  width={100}
                />
              </div>
            </>
          )}
        </div>
      </Popup>
    </div>
  );
}
