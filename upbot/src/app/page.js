"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [pingHistory, setPingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState('');
  const [uptime, setUptime] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [latencyTrend, setLatencyTrend] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isClientPinging, setIsClientPinging] = useState(false);
  const pingIntervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      
      const data = await response.json();
      setPingHistory(data.history);
      setTargetUrl(data.targetUrl);
      
      if (data.history.length > 0) {
        const successCount = data.history.filter(p => p.success).length;
        const newUptime = Math.round((successCount / data.history.length) * 100);
        setUptime(newUptime);
        
        setCurrentStatus(data.history[0].success ? 'online' : 'offline');
        
        // Update latency trend data
        const newTrend = data.history.slice(0, 10).map(ping => ping.latency);
        setLatencyTrend(newTrend);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side pinging function
  const performPing = async () => {
    try {
      const response = await fetch('/api/ping');
      const data = await response.json();
      
      if (data.success) {
        setCurrentStatus('online');
      } else {
        setCurrentStatus('offline');
      }
      
      // Refresh data after ping
      fetchData();
    } catch (error) {
      console.error('Ping failed:', error);
    }
  };

  // Start/stop client-side pinging
  const toggleClientPinging = () => {
    if (isClientPinging) {
      clearInterval(pingIntervalRef.current);
      setIsClientPinging(false);
    } else {
      performPing(); // Initial ping
      pingIntervalRef.current = setInterval(performPing, 60000); // 60 seconds
      setIsClientPinging(true);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh
    const refreshInterval = setInterval(() => {
      if (autoRefresh) {
        fetchData();
      }
    }, 15000);
    
    return () => {
      clearInterval(refreshInterval);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Calculate max latency for chart scaling
  const maxLatency = latencyTrend.length > 0 ? Math.max(...latencyTrend) * 1.2 : 100;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const stats = [
    { 
      title: "Uptime", 
      value: `${uptime}%`, 
      color: "text-emerald-400",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: "Total Pings", 
      value: pingHistory.length, 
      color: "text-cyan-400",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: "Last Ping", 
      value: pingHistory[0]?.timestamp 
        ? new Date(pingHistory[0].timestamp).toLocaleTimeString() 
        : 'N/A',
      color: "text-amber-400",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: "Current Status", 
      value: currentStatus === 'online' ? 'Online' : 'Offline', 
      color: currentStatus === 'online' ? "text-emerald-400" : "text-rose-500",
      icon: currentStatus === 'online' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent animate-pulse-slow"></div>
        <div className="absolute -top-1/3 -right-1/3 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent animate-pulse-slow"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-500/20"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 10 + 2}px`,
              height: `${Math.random() * 10 + 2}px`,
            }}
            animate={{
              y: [0, Math.random() * 50 - 25, 0],
              x: [0, Math.random() * 50 - 25, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Notification banner */}
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-emerald-600 p-4 rounded-xl shadow-xl z-50 flex items-center"
          >
            <div className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-white font-medium">Uptime status updated to {uptime}%</div>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-cyan-500 to-emerald-500 p-3 rounded-xl shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                Website Ping Monitor
              </h1>
              <p className="text-cyan-200/80 text-sm">Real-time monitoring for your web services</p>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Ping Control Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleClientPinging}
              className={`px-4 py-2 rounded-xl font-medium flex items-center space-x-2 ${
                isClientPinging 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <div className={`w-3 h-3 rounded-full mr-2 ${
                isClientPinging ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}></div>
              <span>{isClientPinging ? 'Stop Pinging' : 'Start Pinging'}</span>
            </motion.button>
            
            <div className="flex items-center">
              <span className="text-cyan-200/80 mr-2">Auto refresh</span>
              <div 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${autoRefresh ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <motion.div 
                  className={`bg-white w-4 h-4 rounded-full shadow-md`}
                  animate={{ x: autoRefresh ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                />
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              className="flex items-center space-x-1 bg-gradient-to-r from-cyan-600/30 to-emerald-600/30 hover:from-cyan-600/50 hover:to-emerald-600/50 border border-cyan-500/30 px-4 py-2 rounded-xl transition-all shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Refresh</span>
            </button>
          </motion.div>
        </header>

        {/* Target URL Panel */}
        <motion.div 
          className="mb-10 p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <h2 className="text-xl text-cyan-200">
                Monitoring: 
              </h2>
              <div className="ml-3 font-mono bg-gray-900/80 px-4 py-2 rounded-xl flex items-center border border-cyan-500/30">
                <div className={`w-3 h-3 rounded-full mr-3 ${currentStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-cyan-300">{targetUrl || 'Loading...'}</span>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="text-sm text-cyan-200/70">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full"></div>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h3 className="text-cyan-200/80 text-sm font-medium mb-2">{stat.title}</h3>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-600/30 to-emerald-600/30 p-3 rounded-xl">
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Latency Trend Chart */}
        <motion.div 
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-xl p-6 mb-8 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-cyan-200">Latency Trend</h2>
            <div className="text-sm text-cyan-200/70">Last 10 pings</div>
          </div>
          
          <div className="h-48 flex items-end justify-between">
            {latencyTrend.map((latency, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(latency / maxLatency) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`w-8 rounded-t-lg ${
                    latency < 100 ? 'bg-emerald-500' : 
                    latency < 300 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
                <div className="text-xs text-cyan-200/70 mt-2">{index + 1}</div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4 text-xs text-cyan-200/70">
            <div>Older</div>
            <div>Newer</div>
          </div>
        </motion.div>

        {/* Ping History Table */}
        <motion.div 
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="px-6 py-4 border-b border-cyan-500/20 flex justify-between items-center">
            <h2 className="text-xl font-bold text-cyan-200">Ping History</h2>
            <div className="text-sm text-cyan-200/70">
              Showing last {pingHistory.length} pings
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/30 text-left text-cyan-200/80 text-sm">
                    <th className="px-6 py-4 font-medium">Timestamp</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Response Code</th>
                    <th className="px-6 py-4 font-medium text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {pingHistory.map((ping, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`hover:bg-cyan-500/5 ${index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-900/10'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-cyan-100">
                          {new Date(ping.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-cyan-200/60">
                          {new Date(ping.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          ping.success 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {ping.success ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                              Online
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
                              Offline
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-cyan-100">
                          {ping.statusCode || (ping.error ? 'Error' : 'N/A')}
                        </div>
                        {ping.error && (
                          <div className="text-xs text-rose-400/80 truncate max-w-xs">
                            {ping.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                            ping.latency < 100 ? 'bg-emerald-500/20 text-emerald-400' : 
                            ping.latency < 300 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            <span className="text-sm font-mono">
                              {ping.latency}ms
                            </span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer 
          className="mt-12 pt-8 border-t border-cyan-500/20 text-center text-cyan-200/60 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              © {new Date().getFullYear()} Website Ping Monitor. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-cyan-300 transition-colors">Dashboard</a>
              <a href="#" className="hover:text-cyan-300 transition-colors">Settings</a>
              <a href="#" className="hover:text-cyan-300 transition-colors">Documentation</a>
              <a href="#" className="hover:text-cyan-300 transition-colors">Support</a>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}