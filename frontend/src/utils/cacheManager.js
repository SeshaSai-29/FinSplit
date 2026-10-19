/**
 * Global cache management utility to coordinate cached data on the Home dashboard
 */

export const NOTIFY_DATA_CHANGED_EVENT = 'finsplit_data_changed';

export const notifyDataChanged = () => {
  try {
    localStorage.setItem('home_cache_dirty', 'true');
    window.dispatchEvent(new Event(NOTIFY_DATA_CHANGED_EVENT));
  } catch (err) {
    console.error('Error broadcasting cache invalidation:', err);
  }
};
