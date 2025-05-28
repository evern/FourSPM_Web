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

/**
 * Generate an avatar color based on the user's name
 * @param name The user's name to generate a color for
 * @returns A hex color code
 */
function generateAvatarColor(name: string): string {
  // Simple hash function for the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color (pastel shades for better readability)
  let color = '#';
  for (let i = 0; i < 3; i++) {
    // Generate pastel colors by keeping values between 150-220
    const value = ((hash >> (i * 8)) & 0xFF) % 70 + 150;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Generate initials from a name
 * @param name The user's name
 * @returns Up to 2 initials from the name
 */
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

  // Handle logout confirmation
  const handleLogoutClick = useCallback(() => {
    setConfirmLogout(true);
  }, []);

  // Execute actual logout
  const handleConfirmedLogout = async () => {
    try {
      setLoggingOut(true);
      
      // First, call the signOut function to clear state
      await signOut();

      // Use notification style from memory to show a success message
      notify({
        message: 'Successfully signed out',
        width: 300,
        type: 'success',
        displayTime: 2000,
        position: { at: 'top center', my: 'top center' }
      });
    } catch (error) {
      // Use notification style from memory for error message
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
        text: 'Logout',
        icon: 'runner',
        onClick: handleLogoutClick
      }
    ];
  }, [handleLogoutClick]);

  if (!user) {
    return (
      <div className="user-panel">
        <LoadIndicator visible={true} width={20} height={20} />
      </div>
    );
  }

  // Generate avatar background color and initials from user's name
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarColor = generateAvatarColor(userName);
  const initials = getInitials(userName);
  
  // Create avatar as initials on a background, or use user's avatarUrl if available
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
      
      {/* Logout confirmation popup */}
      <Popup
        visible={confirmLogout}
        dragEnabled={false}
        closeOnOutsideClick={!loggingOut}
        showCloseButton={!loggingOut}
        showTitle={true}
        title="Sign Out"
        onHiding={() => !loggingOut && setConfirmLogout(false)}
        width={300}
        height={180}
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
