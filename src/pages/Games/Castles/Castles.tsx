import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, Trees, Mountain, Swords, Users, Home } from 'lucide-react';
import './Castles.css';

const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;

interface Resources {
  wood: number;
  stone: number;
  food: number;
  gold: number;
}

interface Population {
  current: number;
  max: number;
}

interface Building {
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

interface Unit {
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  task: string | null;
}

interface Tree {
  x: number;
  y: number;
  hp: number;
  type: string;
}

interface Stone {
  x: number;
  y: number;
  hp: number;
  amount: number;
}

interface Enemy {
  type: string;
  x: number;
  y: number;
  hp: number;
  units?: number;
}

interface GameState {
  resources: Resources;
  population: Population;
  buildings: Building[];
  units: Unit[];
  trees: Tree[];
  stones: Stone[];
  enemies: Enemy[];
}

const Castles: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    resources: { wood: 50, stone: 30, food: 100, gold: 20 },
    population: { current: 5, max: 10 },
    buildings: [],
    units: [],
    trees: [],
    stones: [],
    enemies: []
  });
  
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });

  // Инициализация карты
  useEffect(() => {
    const trees: Tree[] = [];
    const stones: Stone[] = [];
    
    // Генерация деревьев
    for (let i = 0; i < 50; i++) {
      trees.push({
        x: Math.floor(Math.random() * MAP_WIDTH),
        y: Math.floor(Math.random() * MAP_HEIGHT),
        hp: 3,
        type: Math.random() > 0.5 ? 'pine' : 'oak'
      });
    }
    
    // Генерация камней
    for (let i = 0; i < 30; i++) {
      stones.push({
        x: Math.floor(Math.random() * MAP_WIDTH),
        y: Math.floor(Math.random() * MAP_HEIGHT),
        hp: 5,
        amount: Math.floor(Math.random() * 20) + 10
      });
    }
    
    // Начальные здания
    const buildings: Building[] = [
      { type: 'townhall', x: 5, y: 5, hp: 200, maxHp: 200 }
    ];
    
    // Начальные юниты
    const units: Unit[] = [
      { type: 'worker', x: 6, y: 6, hp: 50, maxHp: 50, task: null },
      { type: 'worker', x: 7, y: 6, hp: 50, maxHp: 50, task: null },
      { type: 'worker', x: 6, y: 7, hp: 50, maxHp: 50, task: null }
    ];
    
    // Враги
    const enemies: Enemy[] = [
      { type: 'enemy_settlement', x: 25, y: 15, hp: 150, units: 5 }
    ];
    
    setGameState(prev => ({
      ...prev,
      trees,
      stones,
      buildings,
      units,
      enemies
    }));
  }, []);

  // Рендеринг игры
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Очистка
    ctx.fillStyle = '#7cb342';
    ctx.fillRect(0, 0, width, height);
    
    // Сетка
    ctx.strokeStyle = '#689f38';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= MAP_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE - camera.x, 0);
      ctx.lineTo(x * TILE_SIZE - camera.x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= MAP_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE - camera.y);
      ctx.lineTo(width, y * TILE_SIZE - camera.y);
      ctx.stroke();
    }
    
    // Деревья
    gameState.trees.forEach(tree => {
      const x = tree.x * TILE_SIZE - camera.x;
      const y = tree.y * TILE_SIZE - camera.y;
      
      if (x < -TILE_SIZE || x > width + TILE_SIZE || y < -TILE_SIZE || y > height + TILE_SIZE) return;
      
      ctx.fillStyle = tree.type === 'pine' ? '#2e7d32' : '#558b2f';
      ctx.beginPath();
      ctx.arc(x + 16, y + 20, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(x + 13, y + 20, 6, 10);
    });
    
    // Камни
    gameState.stones.forEach(stone => {
      const x = stone.x * TILE_SIZE - camera.x;
      const y = stone.y * TILE_SIZE - camera.y;
      
      if (x < -TILE_SIZE || x > width + TILE_SIZE || y < -TILE_SIZE || y > height + TILE_SIZE) return;
      
      ctx.fillStyle = '#757575';
      ctx.fillRect(x + 8, y + 12, 16, 14);
      ctx.fillStyle = '#9e9e9e';
      ctx.fillRect(x + 10, y + 14, 12, 10);
    });
    
    // Здания
    gameState.buildings.forEach(building => {
      const x = building.x * TILE_SIZE - camera.x;
      const y = building.y * TILE_SIZE - camera.y;
      
      if (x < -TILE_SIZE || x > width + TILE_SIZE || y < -TILE_SIZE || y > height + TILE_SIZE) return;
      
      if (building.type === 'townhall') {
        // Крыша
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 5);
        ctx.lineTo(x + 4, y + 15);
        ctx.lineTo(x + 28, y + 15);
        ctx.closePath();
        ctx.fill();
        
        // Стены
        ctx.fillStyle = '#bcaaa4';
        ctx.fillRect(x + 6, y + 15, 20, 14);
        
        // Дверь
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x + 13, y + 22, 6, 7);
      } else if (building.type === 'house') {
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x + 8, y + 12, 16, 16);
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 8);
        ctx.lineTo(x + 6, y + 14);
        ctx.lineTo(x + 26, y + 14);
        ctx.closePath();
        ctx.fill();
      } else if (building.type === 'barracks') {
        ctx.fillStyle = '#455a64';
        ctx.fillRect(x + 6, y + 10, 20, 18);
        ctx.fillStyle = '#263238';
        ctx.fillRect(x + 13, y + 20, 6, 8);
      }
      
      // HP бар
      const hpPercent = building.hp / building.maxHp;
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 4, y - 4, 24, 3);
      ctx.fillStyle = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(x + 4, y - 4, 24 * hpPercent, 3);
    });
    
    // Юниты
    gameState.units.forEach((unit, idx) => {
      const x = unit.x * TILE_SIZE - camera.x;
      const y = unit.y * TILE_SIZE - camera.y;
      
      if (x < -TILE_SIZE || x > width + TILE_SIZE || y < -TILE_SIZE || y > height + TILE_SIZE) return;
      
      if (unit.type === 'worker') {
        ctx.fillStyle = '#fdd835';
        ctx.fillRect(x + 12, y + 12, 8, 4);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(x + 13, y + 8, 6, 8);
        ctx.fillStyle = '#f9a825';
        ctx.fillRect(x + 13, y + 16, 6, 8);
      } else if (unit.type === 'warrior') {
        ctx.fillStyle = '#e53935';
        ctx.fillRect(x + 12, y + 12, 8, 4);
        ctx.fillStyle = '#ef5350';
        ctx.fillRect(x + 13, y + 8, 6, 8);
        ctx.fillStyle = '#c62828';
        ctx.fillRect(x + 13, y + 16, 6, 8);
      }
      
      if (selectedUnit === idx) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 8, y + 8, 16, 16);
      }
    });
    
    // Враги
    gameState.enemies.forEach(enemy => {
      const x = enemy.x * TILE_SIZE - camera.x;
      const y = enemy.y * TILE_SIZE - camera.y;
      
      if (x < -TILE_SIZE || x > width + TILE_SIZE || y < -TILE_SIZE || y > height + TILE_SIZE) return;
      
      // Вражеское поселение
      ctx.fillStyle = '#c62828';
      ctx.fillRect(x + 6, y + 10, 20, 18);
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(x + 13, y + 20, 6, 8);
      
      // Флаг
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 24, y + 6, 2, 12);
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(x + 26, y + 6, 6, 4);
    });
    
  }, [gameState, camera, selectedUnit]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left + camera.x) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top + camera.y) / TILE_SIZE);
    
    if (selectedTool === 'select') {
      // Выбор юнита
      const unitIdx = gameState.units.findIndex(u => u.x === x && u.y === y);
      setSelectedUnit(unitIdx >= 0 ? unitIdx : null);
    } else if (selectedTool === 'build_house') {
      if (gameState.resources.wood >= 30 && gameState.resources.stone >= 20) {
        setGameState(prev => ({
          ...prev,
          buildings: [...prev.buildings, { type: 'house', x, y, hp: 100, maxHp: 100 }],
          resources: { 
            ...prev.resources, 
            wood: prev.resources.wood - 30,
            stone: prev.resources.stone - 20
          }
        }));
      }
    } else if (selectedTool === 'build_barracks') {
      if (gameState.resources.wood >= 50 && gameState.resources.stone >= 40) {
        setGameState(prev => ({
          ...prev,
          buildings: [...prev.buildings, { type: 'barracks', x, y, hp: 150, maxHp: 150 }],
          resources: { 
            ...prev.resources, 
            wood: prev.resources.wood - 50,
            stone: prev.resources.stone - 40
          }
        }));
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const speed = 5;
    switch(e.key) {
      case 'ArrowUp':
        setCamera(prev => ({ ...prev, y: Math.max(0, prev.y - speed) }));
        break;
      case 'ArrowDown':
        setCamera(prev => ({ ...prev, y: Math.min(MAP_HEIGHT * TILE_SIZE - 600, prev.y + speed) }));
        break;
      case 'ArrowLeft':
        setCamera(prev => ({ ...prev, x: Math.max(0, prev.x - speed) }));
        break;
      case 'ArrowRight':
        setCamera(prev => ({ ...prev, x: Math.min(MAP_WIDTH * TILE_SIZE - 800, prev.x + speed) }));
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="castles-game">
      <div className="castles-header">
        <button className="castles-back-btn" onClick={() => navigate('/games')}>← Back</button>
        <h1>Castles</h1>
      </div>
      
      <div className="castles-ui">
        <div className="resources-panel">
          <div className="resource-item">
            <Trees size={20} />
            <span>{gameState.resources.wood}</span>
          </div>
          <div className="resource-item">
            <Mountain size={20} />
            <span>{gameState.resources.stone}</span>
          </div>
          <div className="resource-item">
            <span>🌾</span>
            <span>{gameState.resources.food}</span>
          </div>
          <div className="resource-item">
            <span>💰</span>
            <span>{gameState.resources.gold}</span>
          </div>
          <div className="resource-item">
            <Users size={20} />
            <span>{gameState.population.current}/{gameState.population.max}</span>
          </div>
        </div>

        <div className="tools-panel">
          <button 
            className={`tool-btn ${selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setSelectedTool('select')}
          >
            Select
          </button>
          <button 
            className={`tool-btn ${selectedTool === 'build_house' ? 'active' : ''}`}
            onClick={() => setSelectedTool('build_house')}
            disabled={gameState.resources.wood < 30 || gameState.resources.stone < 20}
          >
            <Home size={16} />
            House (30W, 20S)
          </button>
          <button 
            className={`tool-btn ${selectedTool === 'build_barracks' ? 'active' : ''}`}
            onClick={() => setSelectedTool('build_barracks')}
            disabled={gameState.resources.wood < 50 || gameState.resources.stone < 40}
          >
            <Swords size={16} />
            Barracks (50W, 40S)
          </button>
        </div>
      </div>

      <div className="castles-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="castles-canvas"
        />
      </div>
      
      <div className="castles-soon-overlay">
        <button className="castles-back-btn-overlay" onClick={() => navigate('/games')}>
          ← Back
        </button>
        <div className="castles-soon-content">
          <h2>Soon</h2>
        </div>
      </div>
    </div>
  );
};

export default Castles;
