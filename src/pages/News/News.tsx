import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../../services/api';
import { NewsItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './News.css';

const NEWS_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'Trading', label: 'Trading' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Regulation', label: 'Regulation' },
];

const News: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch news with React Query
  const { data: newsItems, isLoading, error } = useQuery({
    queryKey: ['news', category],
    queryFn: () => fetchNews(category || undefined),
    staleTime: 60000, // 1 minute
  });

  // Filter by search
  const filteredNews = newsItems?.filter((item: NewsItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.body.toLowerCase().includes(query)
    );
  }) || [];

  // Format date
  const formatDate = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Open article
  const openArticle = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="news-page">
      <div className="page-header">
        <h1 className="page-title">Crypto News</h1>
        <button onClick={() => navigate('/')} className="close-button">
          Close
        </button>
      </div>

      {/* Search */}
      <div className="news-search-container">
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="news-search"
        />
      </div>

      {/* Categories */}
      <div className="news-categories">
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`category-button ${category === cat.value ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="news-loading">Loading news...</div>
      )}

      {/* Error */}
      {error && (
        <div className="news-error">Failed to load news</div>
      )}

      {/* News list */}
      <div className="news-list">
        {filteredNews.map((item: NewsItem) => (
          <article 
            key={item.id} 
            className="news-card"
            onClick={() => openArticle(item.url)}
          >
            {item.imageurl && (
              <img 
                src={item.imageurl} 
                alt={item.title}
                className="news-image"
                loading="lazy"
              />
            )}
            <div className="news-content">
              <h3 className="news-title">{item.title}</h3>
              <p className="news-body">
                {item.body.length > 150 ? `${item.body.slice(0, 150)}...` : item.body}
              </p>
              <div className="news-meta">
                <span className="news-source">{item.source}</span>
                <span className="news-date">{formatDate(item.published_on)}</span>
              </div>
              {item.categories && (
                <div className="news-tags">
                  {item.categories.split('|').slice(0, 3).map((tag, i) => (
                    <span key={i} className="news-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && filteredNews.length === 0 && (
        <div className="news-empty">No news found</div>
      )}
    </div>
  );
};

export default News;

