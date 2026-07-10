import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { BubbleCard } from '../../components/ui';
import './Progress.css';

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
        <button onClick={() => navigate('/menu')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        <BubbleCard className="menu-card" title="Progress">
          <div className="progress-details">
            <p>Progress page content</p>
          </div>
        </BubbleCard>
      </div>
    </div>
  );
};

export default Progress;