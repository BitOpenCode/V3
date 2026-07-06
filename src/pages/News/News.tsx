import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Newspaper } from 'lucide-react';
import { fetchNews } from '../../services/api';
import { NewsItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './News.css';

// newsdata.io's crypto endpoint only accepts real coin tickers for its
// `coin` filter (arbitrary labels like "Trading"/"Technology" get
// rejected with an UnsupportedFilter error, breaking the whole list).
const NEWS_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'btc', label: 'Bitcoin' },
  { value: 'eth', label: 'Ethereum' },
  { value: 'ton', label: 'TON' },
  { value: 'xrp', label: 'XRP' },
  { value: 'bnb', label: 'BNB' },
  { value: 'doge', label: 'Dogecoin' },
  { value: 'ada', label: 'Cardano' },
  { value: 'sol', label: 'Solana' },
];

const News: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Fetch news with React Query
  const { data: newsItems, isLoading, error } = useQuery({
    queryKey: ['news', category],
    queryFn: () => fetchNews(category || undefined),
    staleTime: 60000, // 1 minute
  });

  // Filter by search
  const filteredNews = (Array.isArray(newsItems) ? newsItems : []).filter((item: NewsItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.body.toLowerCase().includes(query)
    );
  });

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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
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
            {item.imageurl && !brokenImages.has(item.id.toString()) ? (
              <img
                src={item.imageurl}
                alt={item.title}
                className="news-image"
                loading="lazy"
                onError={() => setBrokenImages((prev) => new Set(prev).add(item.id.toString()))}
              />
            ) : (
              <div className="news-image news-image-placeholder">
                <Newspaper size={24} />
                <span>NEWS</span>
              </div>
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

