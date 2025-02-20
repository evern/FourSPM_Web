import React, { ReactElement, HTMLAttributes } from 'react';
import './footer.scss';

export default function Footer(props: HTMLAttributes<HTMLElement>): ReactElement {
  return <footer className={`footer ${props.className || ''}`} {...props} />;
}
