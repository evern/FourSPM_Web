import React from 'react';
import './footer.scss';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

const Footer: React.FC<FooterProps> = ({ children, ...rest }) => {
  return <footer className={'footer'} {...rest}>{children}</footer>;
};

export default Footer;
