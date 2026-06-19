const DEFAULT_FALLBACK_VIEW = "home";
const MAX_VIEW_HISTORY = 24;

export function pushViewHistory(history, currentView, nextView) {
  if (!currentView || !nextView || currentView === nextView) return history;
  return [...history, currentView].slice(-MAX_VIEW_HISTORY);
}

export function getPreviousView(history, _currentView, fallbackView = DEFAULT_FALLBACK_VIEW) {
  if (!history.length) {
    return {
      previousView: fallbackView,
      history: []
    };
  }

  const nextHistory = history.slice(0, -1);
  return {
    previousView: history[history.length - 1],
    history: nextHistory
  };
}
