import React from 'react';
import { Button } from '../ui/button';
import { Play, GamepadIcon } from 'lucide-react';

interface GameCardProps {
  game: {
    id: string;
    name: string;
    description?: { markdown: string; truncatedHTML: string; } | null;
    gameType: string;
  };
  onContinue: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onContinue
}) => {

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <GamepadIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 truncate">{game.name}</h3>
          </div>
          
          {game.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {game.description?.truncatedHTML}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {game.gameType}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onContinue}
          size="sm"
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4" />
          Play
        </Button>
      </div>
    </div>
  );
};