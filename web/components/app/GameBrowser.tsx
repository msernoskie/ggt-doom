import React from 'react';
import { useNavigate } from 'react-router';
import { useFindMany } from '@gadgetinc/react';
import { api } from '../../api';
import { GameCard } from './GameCard';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface GameWithSaves {
  id: string;
  name: string;
  description: { markdown: string; truncatedHTML: string; } | null;
  gameType: string;
  swfFile: {
    url: string;
    mimeType: string;
  };
}

export const GameBrowser: React.FC = () => {
  const navigate = useNavigate();

  // Fetch games using useFindMany hook
  const [{ data: games, fetching: loading, error: fetchError }, refetch] = useFindMany(api.game, {
    select: {
      id: true,
      name: true,
      description: {
        markdown: true,
        truncatedHTML: true
      },
      gameType: true,
      swfFile: {
        url: true,
        mimeType: true
      }
    }
  });

  const error = fetchError?.message || null;

  const handleContinueGame = (gameId: string) => {
    navigate(`/play/${gameId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading your games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Games</h2>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
          </div>
          <Button onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Library</h1>
              <p className="text-gray-600 mt-1">
                {games?.length || 0} games
              </p>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Games</h2>
            <span className="text-sm text-gray-500">{games?.length || 0} available</span>
          </div>
          
          {!games || games.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">No games available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onContinue={() => handleContinueGame(game.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};