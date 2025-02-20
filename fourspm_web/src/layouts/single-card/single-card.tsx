import React from 'react';
import ScrollView from 'devextreme-react/scroll-view';
import './single-card.scss';

interface SingleCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SingleCard: React.FC<SingleCardProps> = ({ title, description, children }) => {
  return (
    <ScrollView height={'100%'} width={'100%'} className={'with-footer single-card'}>
      <div className={'dx-card content'}>
        <div className={'header'}>
          <div className={'title'}>{title}</div>
          {description && <div className={'description'}>{description}</div>}
        </div>
        {children}
      </div>
    </ScrollView>
  );
};

export default SingleCard;
