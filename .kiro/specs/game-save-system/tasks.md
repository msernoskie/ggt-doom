# Implementation Plan

- [x] 1. Extend existing Player model for save functionality
  - Add save-related fields to Player model: saveSlots (JSON), lastPlayedGame (belongsTo Game), lastSaveTimestamp (dateTime)
  - Modify gameSettings JSON structure to include save slot management
  - Add saveFiles field (file array) for storing multiple save files
  - Update Player model relationships and validations
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2. Implement Player model actions for save management
- [x] 2.1 Extend Player update action for save operations
  - Modify existing Player update action to handle save slot operations
  - Add validation for slot numbers (1-10) in saveSlots JSON structure
  - Implement save file upload handling within Player context
  - Add user authorization checks for save operations
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 2.2 Create custom Player actions for save management
  - Create savegame action on Player model for creating/updating saves
  - Create loadgame action on Player model for retrieving save data
  - Create deletesave action on Player model for removing specific saves
  - Implement proper validation and error handling for each action
  - _Requirements: 3.2, 3.4, 4.2_

- [ ] 3. Create save management API endpoints
- [x] 3.1 Implement games with saves endpoint using existing models
  - Create GET /api/games/with-saves endpoint that joins Game and Player models
  - Query Player.gameSettings to extract save information for each game
  - Return games list with most recent save information from Player records
  - Add proper authentication and authorization using existing User/Player relationship
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Implement user saves management endpoint using Player model
  - Create GET /api/players/saves endpoint to get current user's Player record
  - Extract and format save data from Player.gameSettings and Player.saveSlots
  - Group saves by game and sort by last saved timestamp
  - Include save metadata and game information from relationships
  - _Requirements: 2.1, 3.3_

- [x] 3.3 Implement specific save operations using Player actions
  - Use Player.savegame action for POST /api/players/savegame/:gameId/:slotNumber
  - Use Player.loadgame action for GET /api/players/loadgame/:gameId/:slotNumber
  - Use Player.loadgame action for GET /api/players/loadgame/:gameId/recent
  - Use Player.deletesave action for DELETE /api/players/deletesave/:gameId/:slotNumber
  - _Requirements: 1.1, 1.3, 2.2, 3.4_

- [ ] 4. Implement Ruffle integration service
- [x] 4.1 Create save state capture functionality
  - Implement function to capture current game state from Ruffle player
  - Extract game metadata (level, score, time played)
  - Generate save data in proper format with checksums
  - Handle Ruffle API errors and unsupported games
  - _Requirements: 1.2, 5.1, 5.2_

- [x] 4.2 Create save state restoration functionality
  - Implement function to restore game state to Ruffle player
  - Validate save data integrity before restoration
  - Handle restoration errors and provide fallbacks
  - Ensure proper game initialization after state load
  - _Requirements: 2.3, 2.4, 5.3_

- [x] 4.3 Implement save data validation and metadata extraction
  - Create save data validation functions
  - Implement game metadata extraction from Ruffle
  - Add screenshot capture functionality for save previews
  - Create compatibility checks for save data
  - _Requirements: 5.4, 6.4_

- [ ] 5. Create game browser interface components
- [x] 5.1 Implement GameBrowser main component
  - Create two-column layout with games and save files
  - Implement game cards with New Game/Continue buttons
  - Add save file browser with game grouping
  - Handle loading states and error conditions
  - _Requirements: 2.1, 3.3_

- [x] 5.2 Create GameCard component
  - Display game information and last played status
  - Implement New Game button functionality
  - Implement Continue button (disabled when no saves exist)
  - Show most recent save timestamp
  - _Requirements: 2.1, 2.2_

- [x] 5.3 Create SaveFileBrowser component
  - Group saves by game with collapsible sections
  - Sort saves by last saved timestamp
  - Display save metadata (timestamp, progress, description)
  - Implement click-to-load functionality
  - Add delete save functionality with confirmation
  - _Requirements: 2.1, 3.3, 3.4_

- [ ] 6. Integrate save system with existing game player
- [x] 6.1 Add in-game save controls to game player
  - Add save/load buttons to game player UI
  - Implement save slot selection interface
  - Add save progress indicators and feedback
  - Handle save/load operations during gameplay
  - _Requirements: 1.1, 1.4, 6.1, 6.2_

- [x] 6.2 Implement save state management in game player
  - Integrate Ruffle save state capture with game player
  - Add automatic save validation and error handling
  - Implement save operation status indicators
  - Add network connectivity handling for save operations
  - _Requirements: 1.2, 5.2, 6.3, 6.5_

- [x] 6.3 Add load functionality to game player initialization
  - Modify game player to accept save data parameter
  - Implement save state restoration on game load
  - Handle load errors with fallback to new game
  - Add loading indicators for save restoration
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 7. Implement save slot management interface
- [x] 7.1 Create SaveSlotManager component
  - Display available save slots (1-10) with status
  - Show save metadata and timestamps
  - Implement save slot selection and confirmation dialogs
  - Add overwrite confirmation for occupied slots
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7.2 Add save description and metadata editing
  - Allow users to add descriptions to saves
  - Display game progress information
  - Show save file size and creation date
  - Implement save renaming functionality
  - _Requirements: 3.3, 6.4_

- [ ] 8. Add comprehensive error handling and user feedback
- [ ] 8.1 Implement error handling for save operations
  - Add specific error messages for different failure types
  - Implement retry mechanisms for network failures
  - Add fallback strategies for save operation failures
  - Create user-friendly error notifications
  - _Requirements: 1.4, 2.5, 6.3_

- [ ] 8.2 Add loading states and progress indicators
  - Implement loading spinners for save/load operations
  - Add progress bars for large save file operations
  - Show operation status messages
  - Add success confirmations for completed operations
  - _Requirements: 6.1, 6.2_

- [ ] 9. Create comprehensive test suite
- [ ] 9.1 Write unit tests for Player save actions and API endpoints
  - Test save data validation and slot constraints in Player model
  - Test user authorization and access control through Player actions
  - Test file storage and retrieval operations using Player.saveFiles
  - Test error handling and edge cases in custom Player actions
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9.2 Write integration tests for Ruffle save state functionality
  - Test save state capture and restoration accuracy
  - Test save data compatibility across game sessions
  - Test error handling for unsupported games
  - Test save metadata extraction and validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9.3 Write end-to-end tests for complete save/load workflows
  - Test complete save operation from game to database
  - Test complete load operation from database to game
  - Test game browser interface functionality
  - Test save management operations
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 10. Implement performance optimizations and security measures
- [ ] 10.1 Add save data compression and size limits
  - Implement save data compression to reduce storage
  - Add file size limits and validation
  - Optimize save/load performance for large files
  - Add cleanup for orphaned save files
  - _Requirements: 4.3, 6.5_

- [ ] 10.2 Enhance security and access control
  - Add additional validation for save data integrity
  - Implement rate limiting for save operations
  - Add audit logging for save management actions
  - Ensure secure file storage and access patterns
  - _Requirements: 4.1, 4.2, 4.3, 4.4_