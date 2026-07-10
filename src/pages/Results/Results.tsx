import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { BubbleCard } from '../../components/ui';
import './Results.css';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="results-page">
      <div className="page-header">
        <h1 className="page-title">Results</h1>
        <button onClick={() => navigate('/menu')} className="close-button">
          {t('close')}
        </button>
      </div>

      <div className="menu-content">
        <BubbleCard className="menu-card" title="Results">
          <div className="results-details">
            <p>Results page content</p>
          </div>
        </BubbleCard>
      </div>
    </div>
  );
};

export default Results;