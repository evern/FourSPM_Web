import React, { ReactElement } from 'react';
import './home.scss';
import logo from '@/assets/images/logo.avif'

export default function Home(): ReactElement {
  return (
    <React.Fragment>
      <h2 className={'content-block'}>Home</h2>
      <div className={'content-block'}>
        <div className={'dx-card responsive-paddings'}>
          <div className={'logos-container'}>
            <img 
              src={logo} 
              alt="4SPM Logo" 
              className={'devextreme-logo'} 
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
