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
    <div className="single-card-wrapper">
      <ScrollView className="single-card-scroll" height="100%" width="100%">
        <div className="single-card">
          <div className="dx-card">
            <div className="header">
              <div className="title">{title}</div>
              {description && <div className="description">{description}</div>}
            </div>
            {children}
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default SingleCard;
