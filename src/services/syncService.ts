// Real-time synchronization service for admin-voter dynamic updates
// Provides cross-device, cross-session synchronization without damaging existing functionality

import { Election, Voter } from '../contexts/VotingContext';

interface SyncState {
  elections: Election[];
  lastUpdated: number;
  forceRefresh: boolean;
}

interface SyncCallbacks {
  onElectionsUpdate: (elections: Election[]) => void;
  onForceRefresh: () => void;
}

class SyncService {
  private pollInterval: NodeJS.Timeout | null = null;
  private callbacks: SyncCallbacks | null = null;
  private lastKnownState: SyncState | null = null;
  private isPolling = false;
  
  // Configuration - Use local API in development, production API in production
  private readonly POLL_INTERVAL = 3000; // 3 seconds
  private readonly API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://dvotingsoftware.onrender.com/api';

  /**
   * Initialize sync service with callbacks for state updates
   */
  initialize(callbacks: SyncCallbacks) {
    this.callbacks = callbacks;
    console.log('SyncService initialized');
  }

  /**
   * Start polling for changes
   */
  startPolling() {
    if (this.isPolling || !this.callbacks) {
      return;
    }

    console.log('Starting real-time sync polling...');
    this.isPolling = true;
    
    // Initial fetch
    this.fetchUpdates();
    
    // Set up polling interval
    this.pollInterval = setInterval(() => {
      this.fetchUpdates();
    }, this.POLL_INTERVAL);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('Sync polling stopped');
  }

  /**
   * Fetch updates from backend
   */
  private async fetchUpdates() {
    try {
      const response = await fetch(`${this.API_BASE}/sync/elections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Sync fetch failed:', response.status);
        return;
      }

      const syncData: SyncState = await response.json();
      
      // Check if we need to update
      if (this.shouldUpdate(syncData)) {
        console.log('Changes detected, updating state...');
        this.lastKnownState = syncData;
        
        if (this.callbacks) {
          // Update elections
          this.callbacks.onElectionsUpdate(syncData.elections);
          
          // Force refresh if needed
          if (syncData.forceRefresh) {
            this.callbacks.onForceRefresh();
          }
        }
      }
    } catch (error) {
      console.warn('Sync service error:', error);
    }
  }

  /**
   * Determine if state should be updated
   */
  private shouldUpdate(newState: SyncState): boolean {
    if (!this.lastKnownState) {
      return true; // First time
    }

    // Check if elections have changed
    if (newState.lastUpdated > this.lastKnownState.lastUpdated) {
      return true;
    }

    // Check if force refresh is needed
    if (newState.forceRefresh && !this.lastKnownState.forceRefresh) {
      return true;
    }

    return false;
  }

  /**
   * Trigger a manual sync
   */
  async triggerSync() {
    console.log('Manual sync triggered...');
    await this.fetchUpdates();
  }

  /**
   * Notify backend of admin action (for triggering sync on other clients)
   */
  async notifyAdminAction(action: string, data?: any) {
    try {
      await fetch(`${this.API_BASE}/elections/admin-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data,
          timestamp: Date.now(),
        }),
      });
      console.log('Admin action notified:', action);
    } catch (error) {
      console.warn('Failed to notify admin action:', error);
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus() {
    return {
      isPolling: this.isPolling,
      lastUpdate: this.lastKnownState?.lastUpdated,
      hasCallbacks: !!this.callbacks,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;