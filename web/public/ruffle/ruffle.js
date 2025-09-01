// Minimal Ruffle stub - allows graceful fallback to CDN
// This stub will fail validation checks, triggering CDN fallback

(function() {
    'use strict';
    
    // Create a minimal stub that mimics Ruffle's expected interface
    // but returns null/undefined to indicate it's not functional
    const RuffleStub = {
        // Version check will fail, triggering CDN fallback
        version: undefined,
        
        // Minimal methods that return null to indicate non-functionality
        newest: function() { return null; },
        load: function() { return null; },
        createPlayer: function() { return null; }
    };
    
    // Expose the stub globally
    if (typeof window !== 'undefined') {
        window.RufflePlayer = RuffleStub;
    }
    
    // Also expose as module if in module environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RuffleStub;
    }
})();