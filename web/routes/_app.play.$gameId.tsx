import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useFindOne } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle, RotateCcw, Volume2, VolumeX, Plus, Minus } from "lucide-react";

// Global flag to track if Ruffle script is loaded
let ruffleScriptLoaded = false;
let ruffleLoadingPromise: Promise<void> | null = null;
let ruffleSource: 'local' | 'cdn' | null = null;

// Function to validate RufflePlayer functionality
const validateRufflePlayer = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const RufflePlayer = (window as any).RufflePlayer;
  if (!RufflePlayer) return false;
  
  // Check if it has the methods we need
  try {
    const ruffle = RufflePlayer.newest();
    return ruffle && typeof ruffle.createPlayer === 'function';
  } catch (e) {
    console.warn('RufflePlayer validation failed:', e);
    return false;
  }
};

// Function to load script from a specific source
const loadScriptFromSource = (src: string, sourceName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      console.log(`Ruffle script loaded from ${sourceName}: ${src}`);
      
      // Wait a bit for the script to initialize, then validate
      setTimeout(() => {
        if (validateRufflePlayer()) {
          console.log(`RufflePlayer validated successfully from ${sourceName}`);
          resolve();
        } else {
          console.error(`RufflePlayer validation failed after loading from ${sourceName}`);
          reject(new Error(`Loaded script from ${sourceName} but RufflePlayer is not functional`));
        }
      }, 100);
    };

    script.onerror = (error) => {
      console.error(`Failed to load Ruffle script from ${sourceName}:`, error);
      reject(new Error(`Failed to load script from ${sourceName}`));
    };

    document.head.appendChild(script);
  });
};

// Function to load the Ruffle script with fallback
const loadRuffleScript = (): Promise<void> => {
  if (ruffleScriptLoaded && validateRufflePlayer()) {
    return Promise.resolve();
  }

  if (ruffleLoadingPromise) {
    return ruffleLoadingPromise;
  }

  ruffleLoadingPromise = new Promise(async (resolve, reject) => {
    // Check if script is already loaded and functional
    if (typeof window !== 'undefined' && validateRufflePlayer()) {
      ruffleScriptLoaded = true;
      resolve();
      return;
    }

    let lastError: Error | null = null;

    // Try local file first
    console.log('Attempting to load Ruffle from local file...');
    try {
      await loadScriptFromSource('/ruffle/ruffle.js', 'local');
      ruffleScriptLoaded = true;
      ruffleSource = 'local';
      console.log('Successfully loaded Ruffle from local file');
      resolve();
      return;
    } catch (error) {
      console.warn('Local Ruffle script failed, trying CDN fallback...', error);
      lastError = error instanceof Error ? error : new Error('Unknown local loading error');
      
      // Remove the failed script element
      const failedScript = document.querySelector('script[src="/ruffle/ruffle.js"]');
      if (failedScript) {
        failedScript.remove();
      }
    }

    // Try CDN fallback
    console.log('Attempting to load Ruffle from CDN...');
    try {
      await loadScriptFromSource('https://unpkg.com/@ruffle-rs/ruffle@latest/ruffle.js', 'CDN');
      ruffleScriptLoaded = true;
      ruffleSource = 'cdn';
      console.log('Successfully loaded Ruffle from CDN');
      resolve();
      return;
    } catch (error) {
      console.error('CDN Ruffle script also failed:', error);
      const cdnError = error instanceof Error ? error : new Error('Unknown CDN loading error');
      
      // Remove the failed CDN script element
      const failedCdnScript = document.querySelector('script[src*="unpkg.com/@ruffle-rs/ruffle"]');
      if (failedCdnScript) {
        failedCdnScript.remove();
      }
      
      // Reset state for potential retry
      ruffleLoadingPromise = null;
      
      // Reject with combined error information
      reject(new Error(
        `Failed to load Ruffle from both sources. Local: ${lastError?.message || 'Unknown error'}. CDN: ${cdnError.message}`
      ));
    }
  });

  return ruffleLoadingPromise;
};

export default function PlayGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const ruffleContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRuffleLoading, setIsRuffleLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.5);
  const [previousVolume, setPreviousVolume] = useState<number>(0.5);
  const [gameReady, setGameReady] = useState(false);

  // Fetch the game data
  const [{ data: game, fetching, error: gameError }] = useFindOne(api.game, gameId!, {
    select: {
      id: true,
      name: true,
      gameType: true,
      swfFile: {
        url: true,
        mimeType: true
      }
    }
  });

  // Function to update player volume
  const updatePlayerVolume = (newVolume: number) => {
    if (playerRef.current) {
      try {
        const ruffleInstance = playerRef.current.ruffle();
        if (ruffleInstance && typeof ruffleInstance.set_volume === 'function') {
          ruffleInstance.set_volume(newVolume);
          console.log(`Player volume set to: ${newVolume}`);
        } else if (playerRef.current.volume !== undefined) {
          playerRef.current.volume = newVolume;
          console.log(`Player volume set to: ${newVolume}`);
        }
      } catch (err) {
        console.warn("Failed to set player volume:", err);
      }
    }
  };

  // Handle volume up
  const handleVolumeUp = () => {
    const newVolume = volume + 0.1;
    setVolume(newVolume);
    updatePlayerVolume(newVolume);
  };

  // Handle volume down
  const handleVolumeDown = () => {
    const newVolume = volume - 0.1;
    setVolume(newVolume);
    updatePlayerVolume(newVolume);
  };

  // Handle mute/unmute toggle
  const handleMuteToggle = () => {
    if (volume > 0) {
      // Mute: store current volume and set to 0
      setPreviousVolume(volume);
      setVolume(0);
      updatePlayerVolume(0);
    } else {
      // Unmute: restore previous volume
      const restoreVolume = previousVolume > 0 ? previousVolume : 0.5;
      setVolume(restoreVolume);
      updatePlayerVolume(restoreVolume);
    }
  };

  // Set client-side flag to prevent SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Ruffle player
  useEffect(() => {
    if (!isClient || !game?.swfFile?.url || !ruffleContainerRef.current) {
      return;
    }

    let isCancelled = false;

    const loadRuffle = async () => {
      console.log("Initializing Ruffle player for:", game.name);
      console.log("Game type:", game.gameType);
      console.log("SWF URL:", game.swfFile.url);
      console.log("MIME type:", game.swfFile.mimeType);
      
      setIsRuffleLoading(true);
      setError(null);

      try {
        // Check if this is actually a Flash game
        if (game.gameType !== "Flash") {
          throw new Error(`Game type "${game.gameType}" is not supported by Flash player`);
        }

        // Load Ruffle script first
        console.log("Loading Ruffle script...");
        setLoadingStatus('Loading Flash Player...');
        
        try {
          await loadRuffleScript();
          if (isCancelled) return;
          
          const sourceText = ruffleSource === 'cdn' ? ' (using CDN fallback)' : '';
          setLoadingStatus(`Flash Player loaded${sourceText}`);
          console.log(`Ruffle loaded from ${ruffleSource} source`);
        } catch (scriptError) {
          throw new Error(`Flash Player failed to load: ${scriptError instanceof Error ? scriptError.message : 'Unknown error'}`);
        }

        // Double-check RufflePlayer functionality
        if (!validateRufflePlayer()) {
          throw new Error("Flash Player loaded but is not functional. This may indicate a corrupted or incomplete installation.");
        }

        // Clear any existing content
        if (ruffleContainerRef.current) {
          ruffleContainerRef.current.innerHTML = '';
        }

        // Create Ruffle player using the window API
        console.log("Creating Ruffle player instance...");
        setLoadingStatus('Initializing game player...');
        
        const ruffle = (window as any).RufflePlayer.newest();
        if (!ruffle || typeof ruffle.createPlayer !== 'function') {
          throw new Error("RufflePlayer is loaded but createPlayer method is not available");
        }
        
        const player = ruffle.createPlayer();
        if (!player) {
          throw new Error("Failed to create Ruffle player instance");
        }
        
        if (isCancelled) return;

        // Store player reference for cleanup
        playerRef.current = player;
        
        // Configure player styling with explicit dimensions
        player.style.width = "100%";
        player.style.height = "100%";
        player.style.minHeight = "600px";
        player.style.backgroundColor = "#000000";
        player.style.display = "block";
        
        // Add event listeners for debugging and state management
        player.addEventListener("loadedmetadata", () => {
          if (!isCancelled) {
            console.log("Game metadata loaded");
            console.log("Movie dimensions:", player.metadata?.width, "x", player.metadata?.height);
            console.log("Movie frame rate:", player.metadata?.frameRate);
            console.log("Movie total frames:", player.metadata?.numFrames);
          }
        });

        player.addEventListener("loadeddata", () => {
          if (!isCancelled) {
            console.log("Game data loaded successfully!");
            setIsRuffleLoading(false);
          }
        });

        // Add player to container BEFORE loading
        if (ruffleContainerRef.current && !isCancelled) {
          ruffleContainerRef.current.appendChild(player);
          console.log("Player added to container");
          
          // Load the SWF file with configuration using proper Ruffle API
          console.log("Loading SWF file...");
          setLoadingStatus('Loading game data...');
          
          const ruffleInstance = player.ruffle();
          if (!ruffleInstance || typeof ruffleInstance.load !== 'function') {
            throw new Error("Ruffle instance is not properly initialized");
          }
          
          ruffleInstance.load({
            url: game.swfFile.url,
            autoplay: "on"
          }).then(() => {
            if (!isCancelled) {
              console.log("Game load promise resolved successfully!");
              setLoadingStatus('');
              // Set initial volume
              updatePlayerVolume(volume);
              setGameReady(true);
            }
          }).catch((loadError: Error) => {
            if (!isCancelled) {
              console.error("Failed to load SWF file:", loadError);
              throw new Error(`Failed to load game file: ${loadError.message}`);
            }
          });
        } else {
          throw new Error("Container not available for player attachment");
        }

      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to load game:", err);
          const errorMessage = err instanceof Error ? err.message : "Failed to load the Flash game";
          setError(errorMessage);
          setIsRuffleLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadRuffle();
    }, 100); // Small delay to ensure DOM is ready

    // Cleanup function
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      
      if (playerRef.current) {
        try {
          // Remove player from DOM
          if (playerRef.current.parentNode) {
            playerRef.current.parentNode.removeChild(playerRef.current);
          }
          playerRef.current = null;
        } catch (cleanupError) {
          console.warn("Error during player cleanup:", cleanupError);
        }
      }
    };
  }, [isClient, game?.swfFile?.url, game?.name, game?.gameType, retryCount]);



  const handleRetry = () => {
    console.log("Retrying game load...");
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoadingStatus('');
    setGameReady(false);
    
    // Reset Ruffle loading state to force a fresh attempt
    ruffleScriptLoaded = false;
    ruffleLoadingPromise = null;
    ruffleSource = null;
  };

  // Show loading state
  if (fetching || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Show game not found error
  if (gameError || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p>Game not found</p>
          <Button onClick={() => navigate("/signed-in")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Show Ruffle loading/error states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Game</h2>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            {retryCount < 3 && (
              <p className="text-xs text-gray-500">
                Retry attempt: {retryCount + 1}/3
              </p>
            )}
            {error?.includes('Flash Player failed to load') && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <p className="font-medium mb-1">Troubleshooting Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Ensure your browser supports modern JavaScript</li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} disabled={retryCount >= 3}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {retryCount >= 3 ? "Max retries reached" : "Retry"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/signed-in")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/signed-in")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">{game.name}</h1>
          </div>
          

          
          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeDown}
              className="p-2"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="p-2"
            >
              {volume > 0 ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeUp}
              className="p-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Player */}
      <div className="flex-1 p-4 relative">
        {isRuffleLoading && (
          <div className="absolute inset-4 bg-black flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-4 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div className="text-center">
                <p className="text-lg">{loadingStatus || 'Initializing Flash Player...'}</p>
                <p className="text-sm text-gray-400 mt-1">Loading {game.name}</p>
                {ruffleSource === 'cdn' && (
                  <p className="text-xs text-yellow-400 mt-2">Using CDN fallback</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div 
          ref={ruffleContainerRef}
          className="w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden"
          style={{
            width: "100%",
            height: "calc(100vh - 120px)",
            minHeight: "600px"
          }}
        />
      </div>
    </div>
  );
}
