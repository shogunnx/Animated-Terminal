import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Activity, 
  Users, 
  MousePointer, 
  Clock, 
  TrendingUp,
  Eye,
  Zap,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Monitor
} from 'lucide-react';

// Get API URL - using the same pattern as other pages
const API_URL = '';  // Empty string uses relative paths which work with proxy

const TerminalAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/summary?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const fetchLiveStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/live`);
      if (!response.ok) throw new Error('Failed to fetch live stats');
      const data = await response.json();
      setLiveStats(data);
    } catch (err) {
      console.warn('Failed to fetch live stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchLiveStats();
  }, [fetchAnalytics, fetchLiveStats]);

  // Auto-refresh live stats
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLiveStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLiveStats]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getPageName = (path) => {
    if (!path) return 'Unknown';
    if (path === '/') return 'Home';
    const parts = path.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' > ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-purple-300" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                Terminal Analytics
              </h1>
              <p className="text-purple-300 text-sm mt-1">Track user engagement across TSV Terminal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-purple-900/50 border border-purple-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-purple-900/50 text-purple-300'
              }`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </button>
            
            {/* Manual Refresh */}
            <button
              onClick={() => { fetchAnalytics(); fetchLiveStats(); }}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Live Stats Banner */}
        {liveStats && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="text-green-400 font-semibold">Live Stats</span>
              <span className="text-green-600 text-xs">(updates every 30s)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{liveStats.active_sessions}</div>
                <div className="text-green-400 text-sm">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{liveStats.events_last_5min}</div>
                <div className="text-green-400 text-sm">Events (5 min)</div>
              </div>
              <div className="col-span-2">
                <div className="text-green-400 text-sm mb-1">Currently Viewing:</div>
                <div className="flex flex-wrap gap-2">
                  {liveStats.current_pages?.length > 0 ? (
                    liveStats.current_pages.map((p, i) => (
                      <span key={i} className="bg-green-900/50 px-2 py-1 rounded text-xs text-white">
                        {getPageName(p.page)} ({p.viewers})
                      </span>
                    ))
                  ) : (
                    <span className="text-green-600 text-sm">No active viewers</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-purple-400" />
              <span className="text-purple-300 text-sm">Total Events</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(analytics?.total_events)}</div>
          </div>
          
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-blue-300 text-sm">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatNumber(analytics?.total_sessions)}</div>
          </div>
          
          <div className="bg-pink-900/30 border border-pink-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-6 h-6 text-pink-400" />
              <span className="text-pink-300 text-sm">Page Views</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(analytics?.page_views?.reduce((sum, p) => sum + p.count, 0))}
            </div>
          </div>
          
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-6 h-6 text-amber-400" />
              <span className="text-amber-300 text-sm">Clicks</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(analytics?.top_clicks?.reduce((sum, c) => sum + c.count, 0))}
            </div>
          </div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Pages */}
          <div className="bg-gray-900/50 border border-purple-700/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Top Pages
            </h3>
            <div className="space-y-3">
              {analytics?.page_views?.slice(0, 10).map((page, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-purple-400 font-mono text-sm w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm truncate">{getPageName(page.page)}</span>
                      <span className="text-purple-300 text-sm font-semibold">{formatNumber(page.count)}</span>
                    </div>
                    <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ 
                          width: `${(page.count / (analytics?.page_views?.[0]?.count || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics?.page_views || analytics.page_views.length === 0) && (
                <p className="text-purple-400 text-center py-4">No page view data yet</p>
              )}
            </div>
          </div>

          {/* Popular Characters */}
          <div className="bg-gray-900/50 border border-pink-700/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Popular Characters
            </h3>
            <div className="space-y-3">
              {analytics?.popular_characters?.slice(0, 10).map((char, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-pink-400 font-mono text-sm w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm capitalize">{char.character?.replace(/_/g, ' ')}</span>
                      <span className="text-pink-300 text-sm font-semibold">{formatNumber(char.visits)} visits</span>
                    </div>
                    <div className="h-2 bg-pink-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full"
                        style={{ 
                          width: `${(char.visits / (analytics?.popular_characters?.[0]?.visits || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!analytics?.popular_characters || analytics.popular_characters.length === 0) && (
                <p className="text-pink-400 text-center py-4">No character data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-gray-900/50 border border-purple-700/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Daily Activity
          </h3>
          <div className="h-48 flex items-end gap-1">
            {analytics?.daily_events?.map((day, i) => {
              const maxCount = Math.max(...(analytics?.daily_events?.map(d => d.count) || [1]));
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t transition-all hover:from-blue-500 hover:to-purple-400"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.count} events`}
                  />
                  <span className="text-xs text-purple-400 transform -rotate-45 origin-center">
                    {day.date?.slice(5)}
                  </span>
                </div>
              );
            })}
            {(!analytics?.daily_events || analytics.daily_events.length === 0) && (
              <p className="text-purple-400 text-center py-4 w-full">No daily data yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity & Feature Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Usage */}
          <div className="bg-gray-900/50 border border-amber-700/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-400" />
              Feature Usage
            </h3>
            <div className="space-y-3">
              {analytics?.feature_usage?.map((feature, i) => (
                <div key={i} className="flex items-center justify-between bg-amber-900/20 rounded-lg px-3 py-2">
                  <span className="text-white">{getPageName(feature.feature)}</span>
                  <span className="text-amber-400 font-semibold">{formatNumber(feature.count)}</span>
                </div>
              ))}
              {(!analytics?.feature_usage || analytics.feature_usage.length === 0) && (
                <p className="text-amber-400 text-center py-4">No feature usage data yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900/50 border border-green-700/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {analytics?.recent_activity?.slice(0, 20).map((event, i) => (
                <div key={i} className="flex items-center gap-3 text-sm bg-green-900/20 rounded-lg px-3 py-2">
                  <span className={`w-2 h-2 rounded-full ${
                    event.event_type === 'page_view' ? 'bg-blue-400' :
                    event.event_type === 'click' ? 'bg-amber-400' :
                    event.event_type === 'feature_use' ? 'bg-green-400' : 'bg-purple-400'
                  }`} />
                  <span className="text-gray-400 text-xs w-16">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-white flex-1 truncate">{getPageName(event.page)}</span>
                  <span className="text-green-400 text-xs capitalize">{event.event_type?.replace('_', ' ')}</span>
                </div>
              ))}
              {(!analytics?.recent_activity || analytics.recent_activity.length === 0) && (
                <p className="text-green-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-purple-500 text-sm">
          <p>TSV Terminal Analytics • Data updates in real-time</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default TerminalAnalytics;
