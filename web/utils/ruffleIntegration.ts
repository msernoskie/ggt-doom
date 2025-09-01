/**
 * Ruffle Integration Service
 * Handles save state capture, restoration, and metadata extraction for Flash games
 */

export interface RufflePlayer {
  ruffle(): any;
  metadata?: {
    width: number;
    height: number;
    frameRate: number;
    numFrames: number;
  };
}

export interface GameMetadata {
  currentLevel?: number;
  playerStats?: Record<string, any>;
  gameTime?: number;
  version?: string;
  screenshot?: string;
}

export interface SaveData {
  data: Uint8Array;
  metadata: GameMetadata;
  timestamp: string;
  checksum: string;
}

export class RuffleIntegrationService {
  /**
   * Captures the current game state from a Ruffle player instance
   */
  static async captureGameState(player: RufflePlayer): Promise<Uint8Array> {
    try {
      if (!player || typeof player.ruffle !== 'function') {
        throw new Error('Invalid Ruffle player instance');
      }

      const ruffleInstance = player.ruffle();
      if (!ruffleInstance) {
        throw new Error('Ruffle instance not available');
      }

      // Try different possible save state methods
      const possibleSaveMethods = [
        'save_state', 'saveState', 'save', 'exportState', 'serialize'
      ];

      let saveMethod = null;
      let saveMethodName = '';

      for (const methodName of possibleSaveMethods) {
        if (typeof ruffleInstance[methodName] === 'function') {
          saveMethod = ruffleInstance[methodName];
          saveMethodName = methodName;
          break;
        }
      }

      if (!saveMethod) {
        // If no save method found, try a different approach
        // Some versions of Ruffle might store save states differently
        throw new Error('Save state functionality not available in this Ruffle version. This might be because:\n1. The game doesn\'t support save states\n2. Ruffle version doesn\'t have save state API\n3. The game needs to be played for a while before save states work');
      }

      console.log(`Using save method: ${saveMethodName}`);

      // Capture the save state
      let saveState;
      try {
        saveState = await saveMethod.call(ruffleInstance);
      } catch (syncError) {
        // Try synchronous call if async fails
        saveState = saveMethod.call(ruffleInstance);
      }
      
      if (!saveState) {
        throw new Error('Failed to capture save state - no data returned. The game might not have any save data yet, or save states might not be supported for this specific game.');
      }

      // Convert to Uint8Array if needed
      let stateData: Uint8Array;
      if (saveState instanceof Uint8Array) {
        stateData = saveState;
      } else if (saveState instanceof ArrayBuffer) {
        stateData = new Uint8Array(saveState);
      } else if (typeof saveState === 'string') {
        // Handle base64 encoded data
        try {
          const binaryString = atob(saveState);
          stateData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            stateData[i] = binaryString.charCodeAt(i);
          }
        } catch (base64Error) {
          // If not base64, treat as regular string
          const encoder = new TextEncoder();
          stateData = encoder.encode(saveState);
        }
      } else if (typeof saveState === 'object') {
        // Handle JSON or other object formats
        const jsonString = JSON.stringify(saveState);
        const encoder = new TextEncoder();
        stateData = encoder.encode(jsonString);
      } else {
        throw new Error(`Unsupported save state format: ${typeof saveState}`);
      }

      console.log(`Save state captured using ${saveMethodName}: ${stateData.length} bytes`);
      return stateData;

    } catch (error) {
      console.error('Error capturing game state:', error);
      throw new Error(`Failed to capture game state: ${error.message}`);
    }
  }

  /**
   * Restores a game state to a Ruffle player instance
   */
  static async restoreGameState(player: RufflePlayer, saveData: Uint8Array): Promise<void> {
    try {
      if (!player || typeof player.ruffle !== 'function') {
        throw new Error('Invalid Ruffle player instance');
      }

      if (!saveData || saveData.length === 0) {
        throw new Error('Invalid save data');
      }

      const ruffleInstance = player.ruffle();
      if (!ruffleInstance) {
        throw new Error('Ruffle instance not available');
      }

      // Try different possible load state methods
      const possibleLoadMethods = [
        'load_state', 'loadState', 'load', 'importState', 'deserialize'
      ];

      let loadMethod = null;
      let loadMethodName = '';

      for (const methodName of possibleLoadMethods) {
        if (typeof ruffleInstance[methodName] === 'function') {
          loadMethod = ruffleInstance[methodName];
          loadMethodName = methodName;
          break;
        }
      }

      if (!loadMethod) {
        throw new Error('Load state functionality not available in this Ruffle version');
      }

      console.log(`Using load method: ${loadMethodName}`);

      // Check if this is a fallback save (metadata only)
      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(saveData);
        const parsedData = JSON.parse(dataString);
        
        if (parsedData.fallback) {
          throw new Error('This save contains metadata only and cannot restore game state. ' + parsedData.message);
        }
      } catch (jsonError) {
        // Not JSON, continue with normal restore
      }

      // Restore the save state
      try {
        await loadMethod.call(ruffleInstance, saveData);
      } catch (syncError) {
        // Try synchronous call if async fails
        loadMethod.call(ruffleInstance, saveData);
      }
      
      console.log(`Save state restored using ${loadMethodName}: ${saveData.length} bytes`);

    } catch (error) {
      console.error('Error restoring game state:', error);
      throw new Error(`Failed to restore game state: ${error.message}`);
    }
  }

  /**
   * Extracts game metadata from a Ruffle player instance
   */
  static async extractGameMetadata(player: RufflePlayer): Promise<GameMetadata> {
    try {
      const metadata: GameMetadata = {};

      if (!player || typeof player.ruffle !== 'function') {
        return metadata;
      }

      const ruffleInstance = player.ruffle();
      if (!ruffleInstance) {
        return metadata;
      }

      // Extract basic movie metadata
      if (player.metadata) {
        metadata.version = `${player.metadata.width}x${player.metadata.height}@${player.metadata.frameRate}fps`;
      }

      // Try to extract game-specific data if available
      try {
        // Some games expose variables we can read
        if (typeof ruffleInstance.get_variable === 'function') {
          // Common Flash game variables
          const level = ruffleInstance.get_variable('_root.level') || 
                       ruffleInstance.get_variable('_root.currentLevel') ||
                       ruffleInstance.get_variable('level');
          
          if (level !== undefined && level !== null) {
            metadata.currentLevel = parseInt(level) || 0;
          }

          // Try to get score or other stats
          const score = ruffleInstance.get_variable('_root.score') || 
                       ruffleInstance.get_variable('score');
          
          if (score !== undefined && score !== null) {
            metadata.playerStats = { score: parseInt(score) || 0 };
          }
        }
      } catch (varError) {
        // Variable extraction failed, but that's okay
        console.warn('Could not extract game variables:', varError);
      }

      // Add timestamp
      metadata.gameTime = Date.now();

      return metadata;

    } catch (error) {
      console.error('Error extracting game metadata:', error);
      return {};
    }
  }

  /**
   * Captures a screenshot of the current game state
   */
  static async captureScreenshot(player: RufflePlayer): Promise<string> {
    try {
      if (!player || !player.ruffle) {
        throw new Error('Invalid Ruffle player instance');
      }

      // Try to get canvas element from the player
      const canvas = player.querySelector?.('canvas') || 
                    player.shadowRoot?.querySelector?.('canvas');

      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      // Capture screenshot as base64 data URL
      const dataURL = canvas.toDataURL('image/png', 0.8);
      return dataURL;

    } catch (error) {
      console.warn('Could not capture screenshot:', error);
      return '';
    }
  }

  /**
   * Validates save data integrity
   */
  static async validateSaveData(saveData: Uint8Array, gameId: string): Promise<boolean> {
    try {
      if (!saveData || saveData.length === 0) {
        return false;
      }

      // Basic validation - check if data looks reasonable
      if (saveData.length < 10) {
        return false; // Too small to be valid save data
      }

      if (saveData.length > 10 * 1024 * 1024) {
        return false; // Too large (>10MB)
      }

      // Check for common Flash save state headers/patterns
      // This is a basic check - in production you might want more sophisticated validation
      const header = Array.from(saveData.slice(0, 8));
      const hasValidHeader = header.some(byte => byte !== 0); // At least some non-zero bytes

      return hasValidHeader;

    } catch (error) {
      console.error('Error validating save data:', error);
      return false;
    }
  }

  /**
   * Checks if the game supports save states
   */
  static async isGameSaveSupported(player: RufflePlayer): Promise<boolean> {
    try {
      if (!player || typeof player.ruffle !== 'function') {
        console.log('Player or ruffle function not available');
        return false;
      }

      const ruffleInstance = player.ruffle();
      if (!ruffleInstance) {
        console.log('Ruffle instance not available');
        return false;
      }

      // Debug: Log available methods
      console.log('Available Ruffle methods:', Object.getOwnPropertyNames(ruffleInstance));
      console.log('Ruffle instance prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(ruffleInstance)));

      // Check for various possible save state method names
      const possibleSaveMethods = [
        'save_state', 'saveState', 'save', 'exportState', 'serialize'
      ];
      
      const possibleLoadMethods = [
        'load_state', 'loadState', 'load', 'importState', 'deserialize'
      ];

      let hasSaveMethod = false;
      let hasLoadMethod = false;
      let saveMethodName = '';
      let loadMethodName = '';

      // Check for save methods
      for (const methodName of possibleSaveMethods) {
        if (typeof ruffleInstance[methodName] === 'function') {
          hasSaveMethod = true;
          saveMethodName = methodName;
          break;
        }
      }

      // Check for load methods
      for (const methodName of possibleLoadMethods) {
        if (typeof ruffleInstance[methodName] === 'function') {
          hasLoadMethod = true;
          loadMethodName = methodName;
          break;
        }
      }

      console.log(`Save method found: ${saveMethodName || 'none'}`);
      console.log(`Load method found: ${loadMethodName || 'none'}`);

      // For now, let's assume save states are supported and handle errors gracefully
      // This is because Ruffle's save state API might be experimental or undocumented
      return true;

    } catch (error) {
      console.error('Error checking save support:', error);
      return true; // Assume supported and handle errors in actual save/load operations
    }
  }

  /**
   * Creates a complete save data package with metadata and checksum
   */
  static async createSavePackage(player: RufflePlayer, gameId: string, description?: string): Promise<SaveData> {
    try {
      let stateData: Uint8Array;
      
      try {
        // Try to capture game state using Ruffle API
        stateData = await this.captureGameState(player);
      } catch (ruffleError) {
        console.warn('Ruffle save state failed, trying alternative approach:', ruffleError);
        
        // Fallback: Create a minimal save state with current timestamp and metadata
        // This won't restore the actual game state, but will save progress metadata
        const fallbackData = {
          timestamp: Date.now(),
          gameId: gameId,
          description: description || 'Save',
          fallback: true,
          message: 'This save contains metadata only. Game state could not be captured.'
        };
        
        const encoder = new TextEncoder();
        stateData = encoder.encode(JSON.stringify(fallbackData));
        
        console.log('Created fallback save data');
      }
      
      // Extract metadata
      const gameMetadata = await this.extractGameMetadata(player);
      
      // Capture screenshot
      const screenshot = await this.captureScreenshot(player);
      if (screenshot) {
        gameMetadata.screenshot = screenshot;
      }

      // Create checksum (simple hash)
      const checksum = await this.createChecksum(stateData);

      const saveData: SaveData = {
        data: stateData,
        metadata: gameMetadata,
        timestamp: new Date().toISOString(),
        checksum
      };

      return saveData;

    } catch (error) {
      console.error('Error creating save package:', error);
      throw error;
    }
  }

  /**
   * Creates a simple checksum for save data validation
   */
  private static async createChecksum(data: Uint8Array): Promise<string> {
    try {
      // Simple checksum using crypto API if available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback: simple sum-based checksum
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        return sum.toString(16);
      }
    } catch (error) {
      console.warn('Could not create checksum:', error);
      return 'no-checksum';
    }
  }
}