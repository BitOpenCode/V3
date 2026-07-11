import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Newspaper } from 'lucide-react';
import { fetchCombinedNews } from '../../services/api';
import { NewsItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './News.css';

const NEWS_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'btc', label: 'Bitcoin' },
  { value: 'altcoins', label: 'Altcoins' },
  { value: 'tech', label: 'Tech' },
  { value: 'ai', label: 'AI' },
  { value: 'game', label: 'Game' },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  btc: ['bitcoin', 'btc', 'satoshi'],
  altcoins: [
    'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
    'xrp', 'ripple', 'dogecoin', 'doge', 'bnb', 'polygon',
    'matic', 'avalanche', 'avax', 'polkadot', 'dot',
    'chainlink', 'link', 'uniswap', 'uni', 'arbitrum', 'arb',
    'optimism', 'op', 'aptos', 'apt', 'sui', 'near', 'algorand',
  ],
  tech: [
    'blockchain', 'protocol', 'upgrade', 'scaling', 'layer2',
    'rollup', 'zero-knowledge', 'privacy', 'security', 'node',
    'validator', 'governance', 'dao', 'fork',
  ],
  ai: [
    'artificial intelligence', 'machine learning',
    'neural network', 'deep learning', 'automation',
    'agi', 'llm', 'chatgpt', 'gpt', 'openai', 'anthropic',
  ],
  game: [
    'gaming', 'metaverse', 'play-to-earn', 'nft',
    'web3 game', 'esports',
  ],
};

const BLACKLIST_WORDS: Record<string, string[]> = {
  btc: [
    'xrp', 'ripple', 'cardano', 'ada', 'solana', 'sol',
    'dogecoin', 'doge', 'bnb', 'eth', 'ethereum', 'matic', 'polygon',
    'avalanche', 'avax', 'dot', 'polkadot', 'uni', 'uniswap',
    'caspa', 'casp', 'kaspa',
  ],
  altcoins: ['bitcoin', 'btc', 'satoshi'],
  tech: ['bitcoin', 'btc', 'xrp', 'ripple', 'doge', 'shiba'],
  ai: ['bitcoin', 'btc', 'xrp', 'ripple', 'doge'],
  game: ['bitcoin', 'btc', 'xrp', 'ripple'],
  rwa: ['bitcoin', 'btc', 'xrp', 'ripple'],
};

const News: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // ОДИН ЗАПРОС — КЕШ НА 10 МИНУТ
  const { data: allNews, isLoading, error } = useQuery({
    queryKey: ['news', 'all'],
    queryFn: () => fetchCombinedNews(),
    staleTime: 600000, // 10 минут — данные считаются свежими
    gcTime: 600000,    // 10 минут — хранятся в кеше
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filteredNews = useMemo(() => {
    const items = Array.isArray(allNews) ? allNews : [];
    
    return items.filter((item: NewsItem) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match = item.title.toLowerCase().includes(query) || 
                      item.body.toLowerCase().includes(query);
        if (!match) return false;
      }

      if (!category) return true;

      const keywords = CATEGORY_KEYWORDS[category] || [];
      const blacklist = BLACKLIST_WORDS[category] || [];
      const text = (item.title + ' ' + item.body + ' ' + (item.categories || '')).toLowerCase();

      const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));
      if (!hasKeyword) return false;

      const isBlocked = blacklist.some(word => text.includes(word.toLowerCase()));
      if (isBlocked) return false;

      return true;
    });
  }, [allNews, category, searchQuery]);

  const formatDate = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    } catch {
      return '';
    }
  };

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

      {isLoading && <div className="news-loading">Loading news...</div>}
      {error && <div className="news-error">Failed to load news</div>}

      <div className="news-list">
        {filteredNews.length > 0 ? (
          filteredNews.map((item: NewsItem) => {
            const hasImageError = imageErrors.has(item.id.toString());
            const hasImageUrl = !!item.imageurl;

            return (
              <article 
                key={item.id} 
                className="news-card"
                onClick={() => openArticle(item.url)}
              >
                <div className="news-image-wrapper">
                  <div className="news-image-placeholder">
                    <Newspaper size={24} />
                    <span>NEWS</span>
                  </div>
                  {hasImageUrl && !hasImageError && (
                    <img
                      src={item.imageurl}
                      alt={item.title}
                      className="news-image"
                      loading="lazy"
                      onError={() => {
                        setImageErrors(prev => new Set(prev).add(item.id.toString()));
                      }}
                    />
                  )}
                </div>
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
            );
          })
        ) : (
          <div className="news-empty">No news found</div>
        )}
      </div>
    </div>
  );
};

export default News;