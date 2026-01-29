import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

interface LoginScreenProps {
  userId: string;
  onUserIdChange: (value: string) => void;
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ userId, onUserIdChange, onLogin }) => {
  const navigate = useNavigate();
  const staticStarsRef = useRef<HTMLDivElement>(null);

  // Create static twinkling stars
  useEffect(() => {
    if (!staticStarsRef.current) return;

    const container = staticStarsRef.current;
    container.innerHTML = '';

    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'static_star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = `${0.4 + Math.random() * 0.6}`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${2 + Math.random() * 3}s`;
      container.appendChild(star);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="login-screen-container">
      <div ref={staticStarsRef} className="static_stars_container" />
      
      <div className="login-menu">
        <h1>SPACE ADVENTURE</h1>
        
        <input
          type="text"
          placeholder="Enter your login"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          maxLength={20}
          className="login-input"
        />
        
        <button onClick={onLogin} className="menu-btn">Start</button>
      </div>
      
      <button onClick={() => navigate('/games')} className="menu-btn back-btn">← Back</button>
    </div>
  );
};

export default LoginScreen;
