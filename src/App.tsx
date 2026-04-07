import React, { useEffect, useState, useRef } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  Bell, 
  Briefcase, 
  Activity, 
  Server as ServerIcon, 
  Radio, 
  Database, 
  Wifi, 
  Maximize2, 
  Scan,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  LogOut,
  LogIn,
  Trash2,
  Globe,
  Wrench,
  ChevronDown,
  Layout,
  ChartCandlestick,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  PenTool,
  Type,
  Brush,
  Shapes,
  Ruler,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Undo2,
  Redo2,
  Camera,
  Plus,
  MoreHorizontal,
  Clock,
  History,
  LayoutGrid,
  User,
  Share2,
  List,
  Info,
  Gauge,
  Newspaper,
  Calendar,
  Wallet,
  ShieldCheck,
  Target,
  Link2,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ComposedChart,
  Bar,
  Cell,
  Line,
  ReferenceLine,
  Scatter
} from 'recharts';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

// --- Types ---

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: string;
}

interface TickData {
  price: number;
  timestamp: string;
  change: 'up' | 'down';
}

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  sl: number;
  tp: number;
  confidence: number;
  time: string;
  isHighConviction?: boolean;
  reason?: string;
}

interface Pattern {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  confidence: number;
  status: 'confirmed' | 'forming' | 'detected';
}

interface Drawing {
  id: string;
  type: 'line' | 'rect' | 'fib' | 'brush' | 'text';
  points: { x: number; y: number }[];
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  currentPrice?: number;
  lot_size: number;
  profit?: number;
  sl?: number;
  tp?: number;
  created_at: string;
  status: 'PENDING_APPROVAL' | 'OPEN' | 'CLOSED' | 'REJECTED';
  broker_id?: string;
  user_id?: string;
}

interface BrokerAccount {
  id: string;
  name: string;
  provider: 'OANDA' | 'MetaTrader' | 'IG' | 'Interactive Brokers';
  accountId: string;
  status: 'connected' | 'disconnected';
  balance: number;
  currency: string;
}

// --- Components ---

const TVButton = ({ 
  children, 
  onClick, 
  active, 
  className, 
  title 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  active?: boolean; 
  className?: string;
  title?: string;
  key?: string | number;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded transition-colors text-[13px] font-medium",
      active 
        ? "bg-[#2962ff]/10 text-[#2962ff]" 
        : "text-[#d1d4dc] hover:bg-[#2a2e39]",
      className
    )}
  >
    {children}
  </button>
);

const TVIconButton = ({ 
  icon: Icon, 
  onClick, 
  active, 
  className, 
  title,
  size = 18
}: { 
  icon: any; 
  onClick?: () => void; 
  active?: boolean; 
  className?: string;
  title?: string;
  size?: number;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "flex items-center justify-center p-2 rounded transition-colors",
      active 
        ? "bg-[#2962ff]/10 text-[#2962ff]" 
        : "text-[#d1d4dc] hover:bg-[#2a2e39]",
      className
    )}
  >
    <Icon size={size} />
  </button>
);

const ConnectionBadge = ({ label, status, detail }: { label: string; status: 'connected' | 'disconnected' | 'error'; detail: string }) => (
  <div className={cn(
    "px-2 py-1 rounded flex items-center gap-2 border text-[11px] font-medium transition-all",
    status === 'connected' ? "bg-[#089981]/10 border-[#089981]/20 text-[#089981]" : "bg-[#f23645]/10 border-[#f23645]/20 text-[#f23645]"
  )}>
    <div className={cn("w-1.5 h-1.5 rounded-full", status === 'connected' ? "bg-[#089981] animate-pulse" : "bg-[#f23645]")} />
    <span className="whitespace-nowrap">{label}</span>
    <span className="opacity-40">{detail}</span>
  </div>
);

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string; key?: React.Key }) => (
  <div className={cn("bg-[#1e222d] border border-[#2a2e39]", className)}>
    {children}
  </div>
);

const TVPanel = GlassCard;

const CHART_PATTERNS = [
  'Head and Shoulders',
  'Inverse Head and Shoulders',
  'Double Top',
  'Double Bottom',
  'Triple Top',
  'Triple Bottom',
  'Falling Wedge',
  'Diamond',
  'Broadening Triangle',
  'Symmetrical Triangle',
  'Consolidation',
  'Flag',
  'Pennant',
  'Ascending Triangle',
  'Descending Triangle',
  'Cup and Handle',
  'Rising Wedge',
  'Rectangle'
];

export default function App() {
  const [activeSymbol, setActiveSymbol] = useState('GBP/JPY');
  const [prices, setPrices] = useState<Record<string, number>>({
    'EUR/USD': 1.09234,
    'GBP/USD': 1.26780,
    'USD/JPY': 150.45,
    'AUD/USD': 0.65432,
    'USD/CAD': 1.35670,
    'USD/CHF': 0.88450,
    'NZD/USD': 0.61230,
    'EUR/GBP': 0.85450,
    'EUR/JPY': 164.20,
    'GBP/JPY': 191.50,
    'XAU/USD': 2034.50,
    'BTC/USD': 62450.00,
    'USD/MXN': 17.05,
    'EUR/CHF': 0.9540,
    'GBP/CHF': 1.1120,
    'AUD/JPY': 98.45,
    'NZD/JPY': 92.30,
    'CAD/JPY': 111.15,
    'EUR/AUD': 1.6680,
    'GBP/AUD': 1.9350,
    'XTI/USD': 78.45,
    'ETH/USD': 3450.00
  });
  const [history, setHistory] = useState<Record<string, CandleData[]>>(() => {
    const initial: Record<string, CandleData[]> = {};
    const symbols = [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD', 
      'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'BTC/USD', 'USD/MXN', 'EUR/CHF', 
      'GBP/CHF', 'AUD/JPY', 'NZD/JPY', 'CAD/JPY', 'EUR/AUD', 'GBP/AUD', 'XTI/USD', 'ETH/USD'
    ];
    
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.09234, 'GBP/USD': 1.26780, 'USD/JPY': 150.45, 'AUD/USD': 0.65432,
      'USD/CAD': 1.35670, 'USD/CHF': 0.88450, 'NZD/USD': 0.61230, 'EUR/GBP': 0.85450,
      'EUR/JPY': 164.20, 'GBP/JPY': 191.50, 'XAU/USD': 2034.50, 'BTC/USD': 62450.00,
      'USD/MXN': 17.05, 'EUR/CHF': 0.9540, 'GBP/CHF': 1.1120, 'AUD/JPY': 98.45,
      'NZD/JPY': 92.30, 'CAD/JPY': 111.15, 'EUR/AUD': 1.6680, 'GBP/AUD': 1.9350,
      'XTI/USD': 78.45, 'ETH/USD': 3450.00
    };

    symbols.forEach(symbol => {
      let currentPrice = basePrices[symbol] || 1.0;
      const candles: CandleData[] = [];
      const now = Date.now();
      const interval = 60000; // 1m

      for (let i = 100; i > 0; i--) {
        const volatility = symbol.includes('JPY') ? 0.05 : (symbol.includes('USD') ? 0.0005 : 0.01);
        const open = currentPrice;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * (volatility / 2);
        const low = Math.min(open, close) - Math.random() * (volatility / 2);
        
        candles.push({
          open, high, low, close,
          timestamp: new Date(now - i * interval).toISOString()
        });
        currentPrice = close;
      }
      initial[symbol] = candles;
    });
    return initial;
  });
  const tickBuffer = useRef<Record<string, number>>({});
  const historyBuffer = useRef<Record<string, CandleData[]>>({});
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [activeTab, setActiveTab] = useState('Trading');
  const [timeframe, setTimeframe] = useState(() => localStorage.getItem('nextrade_timeframe') || '15m');
  useEffect(() => {
    localStorage.setItem('nextrade_timeframe', timeframe);
  }, [timeframe]);
  const [zoom, setZoom] = useState(30);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingType, setDrawingType] = useState<'line' | 'rect' | 'fib' | 'brush' | 'text'>('line');
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [showDrawingSettings, setShowDrawingSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; drawingId: string } | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showPatterns, setShowPatterns] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState('MT5 Bridge');
  const [lotSize, setLotSize] = useState('0.50');
  const [slInput, setSlInput] = useState('');
  const [tpInput, setTpInput] = useState('');
  const [showChartMenu, setShowChartMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ id: string; startX: number; startY: number; initialPoints: any[] } | null>(null);
  const handleChartMouseDown = (e: React.MouseEvent) => {
    if (!selectedDrawingTool || selectedDrawingTool === 'cursor') return;
    if (!chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newDrawing: Drawing = {
      id: Math.random().toString(36).substr(2, 9),
      type: drawingType,
      points: [{ x, y }, { x, y }],
      color: '#2962ff',
      thickness: 1,
      style: 'solid'
    };
    setDrawings(prev => [...prev, newDrawing]);
    setSelectedDrawingId(newDrawing.id);
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawings(prev => prev.map(d => {
      if (d.id === selectedDrawingId) {
        if (d.type === 'brush') {
          return { ...d, points: [...d.points, { x, y }] };
        }
        return { ...d, points: [d.points[0], { x, y }] };
      }
      return d;
    }));
  };

  const handleChartMouseUp = () => {
    setIsDrawing(false);
    if (selectedDrawingTool !== 'brush') {
      setSelectedDrawingTool('cursor');
    }
  };

  const handleDrawingDoubleClick = (e: React.MouseEvent, drawing: Drawing) => {
    e.stopPropagation();
    setSelectedDrawingId(drawing.id);
    setShowDrawingSettings(true);
  };

  const handleDrawingContextMenu = (e: React.MouseEvent, drawing: Drawing) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, drawingId: drawing.id });
  };

  const updateDrawing = (id: string, updates: Partial<Drawing>) => {
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDrawing = (id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id));
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<Signal[]>([
    { id: '1', type: 'BUY', symbol: 'EUR/USD', price: 1.09250, sl: 1.09150, tp: 1.09550, confidence: 94, time: '15m' },
    { id: '2', type: 'SELL', symbol: 'GBP/USD', price: 1.26780, sl: 1.26880, tp: 1.26480, confidence: 87, time: '1h' },
  ]);
  const [patterns, setPatterns] = useState<Pattern[]>([
    { id: '1', name: 'Head and Shoulders', symbol: 'EUR/USD', timeframe: '15m', confidence: 94, status: 'confirmed' },
    { id: '2', name: 'Double Top', symbol: 'GBP/USD', timeframe: '1h', confidence: 87, status: 'forming' },
    { id: '3', name: 'Rising Wedge', symbol: 'USD/JPY', timeframe: '4h', confidence: 76, status: 'detected' },
  ]);
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [rightPanel, setRightPanel] = useState<'watchlist' | 'details' | 'news'>('watchlist');
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<string | null>(null);
  const [isMagnetEnabled, setIsMagnetEnabled] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [areDrawingsHidden, setAreDrawingsHidden] = useState(false);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([
    { id: '1', name: 'OANDA Live', provider: 'OANDA', accountId: '101-004-1234567-001', status: 'connected', balance: 25450.50, currency: 'USD' },
    { id: '2', name: 'MT5 Prop', provider: 'MetaTrader', accountId: '8823451', status: 'disconnected', balance: 100000.00, currency: 'USD' }
  ]);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<Trade | null>(null);

  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    // 1. Initial Data Fetch from Supabase
    const fetchData = async () => {
      try {
        const { data: signalsData } = await supabase.from('signals').select('*').order('created_at', { ascending: false });
        if (signalsData) setSignals(signalsData);

        const { data: patternsData } = await supabase.from('patterns').select('*').order('created_at', { ascending: false });
        if (patternsData) setPatterns(patternsData);

        const { data: tradesData } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
        if (tradesData) setTrades(tradesData);
        
        setSupabaseStatus('connected');
      } catch (error) {
        console.error('Error fetching Supabase data:', error);
      }
    };

    fetchData();

    // 2. Real-time Subscriptions
    const signalsSubscription = supabase
      .channel('public:signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, payload => {
        setSignals(prev => [payload.new as Signal, ...prev].slice(0, 10));
      })
      .subscribe();

    const patternsSubscription = supabase
      .channel('public:patterns')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patterns' }, payload => {
        setPatterns(prev => [payload.new as Pattern, ...prev].slice(0, 10));
      })
      .subscribe();

    const tradesSubscription = supabase
      .channel('public:trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, payload => {
        if (payload.eventType === 'INSERT') {
          setTrades(prev => [payload.new as Trade, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrades(prev => prev.map(t => t.id === payload.new.id ? payload.new as Trade : t));
        } else if (payload.eventType === 'DELETE') {
          setTrades(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .subscribe();

    // 3. WebSocket for Price Feed
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);
      ws.current = socket;

      socket.onopen = () => setWsStatus('connected');
      socket.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connectWS, 3000); // Reconnect after 3s
      };
      socket.onerror = () => setWsStatus('error');
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'TICK') {
          if (typeof data.price !== 'number' || isNaN(data.price)) return;
          
          tickBuffer.current[data.symbol] = data.price;
          
          const symbolHistory = historyBuffer.current[data.symbol] || history[data.symbol] || [];
          const lastCandle = symbolHistory[symbolHistory.length - 1];
          
          const tfMap: Record<string, number> = {
            '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000, '1h': 3600000, '4h': 14400000, '1d': 86400000
          };
          const interval = tfMap[timeframe] || 60000;
          const now = new Date(data.timestamp).getTime();
          const currentCandleTime = Math.floor(now / interval) * interval;
          const lastCandleTime = lastCandle ? new Date(lastCandle.timestamp).getTime() : 0;
          const isNewCandle = !lastCandle || (currentCandleTime > lastCandleTime);

          if (isNewCandle) {
            const newCandle: CandleData = {
              open: data.price, high: data.price, low: data.price, close: data.price,
              timestamp: new Date(currentCandleTime).toISOString()
            };
            historyBuffer.current[data.symbol] = [...symbolHistory, newCandle].slice(-100);
          } else {
            const updatedCandle: CandleData = {
              ...lastCandle,
              high: Math.max(lastCandle.high, data.price),
              low: Math.min(lastCandle.low, data.price),
              close: data.price
            };
            historyBuffer.current[data.symbol] = [...symbolHistory.slice(0, -1), updatedCandle];
          }
        } else if (data.type === 'ORDER_FILLED') {
          toast.success(`Order Filled: ${data.symbol}`, {
            description: `ID: ${data.orderId} @ ${data.price.toFixed(5)}`,
          });
        }
      };

      // Interval to flush buffers to state
      const flushInterval = setInterval(() => {
        if (Object.keys(tickBuffer.current).length > 0) {
          setPrices(prev => ({ ...prev, ...tickBuffer.current }));
          tickBuffer.current = {};
        }
        if (Object.keys(historyBuffer.current).length > 0) {
          setHistory(prev => ({ ...prev, ...historyBuffer.current }));
          historyBuffer.current = {};
        }
      }, 200);

      return () => {
        clearInterval(flushInterval);
        socket.close();
      };
    };

    connectWS();

    return () => {
      ws.current?.close();
      supabase.removeChannel(signalsSubscription);
      supabase.removeChannel(patternsSubscription);
    };
  }, [timeframe]);

  // Handle click outside for menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowChartMenu(false);
        setShowToolsMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pattern Detection Simulation
  useEffect(() => {
    const patternInterval = setInterval(() => {
      const randomPattern = CHART_PATTERNS[Math.floor(Math.random() * CHART_PATTERNS.length)];
      const symbols = Object.keys(prices);
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
      const randomTF = timeframes[Math.floor(Math.random() * timeframes.length)];
      const status: 'forming' | 'confirmed' = Math.random() > 0.5 ? 'forming' : 'confirmed';
      
      const newPattern: Pattern = {
        id: Math.random().toString(36).substr(2, 9),
        name: randomPattern,
        symbol: randomSymbol,
        timeframe: randomTF,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        status
      };

      setPatterns(prev => [newPattern, ...prev].slice(0, 10));

      if (status === 'forming') {
        toast.info(`Pattern Forming: ${randomPattern}`, {
          description: `${randomSymbol} on ${randomTF} timeframe. Confidence: ${newPattern.confidence}%`,
          icon: <Activity className="w-4 h-4 text-blue-400" />
        });
      } else {
        toast.success(`Pattern Confirmed: ${randomPattern}`, {
          description: `${randomSymbol} on ${randomTF} timeframe. High probability setup!`,
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />
        });
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(patternInterval);
  }, [prices]);

  // Combinatorial Logic for High Conviction Signals
  useEffect(() => {
    const generateHighConvictionSignals = () => {
      const newSignals: Signal[] = [];
      const symbols = Object.keys(prices);

      symbols.forEach(symbol => {
        const symbolPatterns = patterns.filter(p => p.symbol === symbol && p.status === 'confirmed');
        const currentPrice = prices[symbol];
        const symbolHistory = history[symbol] || [];
        
        if (symbolPatterns.length === 0 || !currentPrice) return;

        // Calculate RSI for confluence
        const rsiPeriod = 14;
        let currentRSI = 50;
        if (symbolHistory.length >= rsiPeriod) {
          const data = symbolHistory.slice(-rsiPeriod);
          let gains = 0;
          let losses = 0;
          for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i-1].close;
            if (change > 0) gains += change;
            else losses += Math.abs(change);
          }
          const avgGain = gains / rsiPeriod;
          const avgLoss = losses / rsiPeriod;
          if (avgLoss === 0) currentRSI = 100;
          else {
            const rs = avgGain / avgLoss;
            currentRSI = 100 - (100 / (1 + rs));
          }
        }

        symbolPatterns.forEach(pattern => {
          let type: 'BUY' | 'SELL' | null = null;
          let sl = 0;
          let tp = 0;
          let entry = currentPrice;
          let confidenceBoost = 0;

          // Combinatorial Logic: Pattern + RSI Confluence
          const isBullishPattern = ['Double Bottom', 'Inverse Head and Shoulders', 'Falling Wedge', 'Ascending Triangle', 'Cup and Handle'].includes(pattern.name);
          const isBearishPattern = ['Double Top', 'Head and Shoulders', 'Rising Wedge', 'Descending Triangle', 'Rectangle'].includes(pattern.name);

          if (isBullishPattern && currentRSI < 40) {
            type = 'BUY';
            confidenceBoost = 5;
          } else if (isBearishPattern && currentRSI > 60) {
            type = 'SELL';
            confidenceBoost = 5;
          } else if (pattern.confidence > 92) {
            // High confidence even without RSI confluence
            type = isBullishPattern ? 'BUY' : 'SELL';
          }

          if (type) {
            const volatility = symbol.includes('JPY') ? 0.5 : (symbol.includes('USD') ? 0.0020 : 0.1);
            
            if (type === 'BUY') {
              sl = entry - volatility;
              tp = entry + (volatility * 2.5); // 1:2.5 RR
            } else {
              sl = entry + volatility;
              tp = entry - (volatility * 2.5);
            }

            // Check if this signal already exists to avoid duplicates
            const exists = signals.some(s => s.symbol === symbol && s.type === type && Math.abs(s.price - entry) < volatility/10);
            
            if (!exists) {
              newSignals.push({
                id: `hc-${Math.random().toString(36).substr(2, 5)}`,
                type,
                symbol,
                price: entry,
                sl,
                tp,
                confidence: Math.min(pattern.confidence + confidenceBoost, 99),
                time: timeframe,
                isHighConviction: true,
                reason: confidenceBoost > 0 ? `${pattern.name} + RSI Confluence` : `${pattern.name} (High Confidence)`
              });
            }
          }
        });
      });

      if (newSignals.length > 0) {
        setSignals(prev => [...newSignals, ...prev].slice(0, 15));
        newSignals.forEach(s => {
          toast.success(`High Conviction ${s.type} Signal`, {
            description: `${s.symbol} @ ${s.price.toFixed(5)} | SL: ${s.sl.toFixed(5)} | TP: ${s.tp.toFixed(5)}`,
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            duration: 8000
          });
        });
      }
    };

    const timer = setTimeout(generateHighConvictionSignals, 2000);
    return () => clearTimeout(timer);
  }, [patterns, timeframe]); // Run when patterns or timeframe changes

  const chartData = React.useMemo(() => {
    const data = (history[activeSymbol] || []).filter(h => h && typeof h.close === 'number' && !isNaN(h.close)).slice(-zoom);
    
    // Calculate RSI (14 period)
    const rsiPeriod = 14;
    return data.map((h, i) => {
      let rsi = 50; // Default
      if (i >= rsiPeriod) {
        let gains = 0;
        let losses = 0;
        for (let j = i - rsiPeriod + 1; j <= i; j++) {
          const change = data[j].close - data[j].open;
          if (change > 0) gains += change;
          else losses += Math.abs(change);
        }
        const avgGain = gains / rsiPeriod;
        const avgLoss = losses / rsiPeriod;
        if (avgLoss === 0) rsi = 100;
        else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }
      }

      const activePatterns = patterns.filter(p => p.symbol === activeSymbol);
      const hasPattern = activePatterns.some(p => p.status === 'confirmed');
      const patternName = activePatterns.find(p => p.status === 'confirmed')?.name;

      return {
        ...h,
        time: i,
        rsi,
        pattern: (hasPattern && i === data.length - 1) ? patternName : null,
        // For Recharts Bar range: [bottom, top]
        body: [Math.min(h.open, h.close), Math.max(h.open, h.close)],
        wick: [h.low, h.high]
      };
    });
  }, [history, activeSymbol, zoom, patterns]);

  const handlePlaceOrder = (type: 'BUY' | 'SELL', symbol: string = activeSymbol, price: number = prices[activeSymbol], sl?: number, tp?: number) => {
    if (!isLoggedIn) {
      toast.error('Please login to place orders');
      return;
    }
    
    const activeBroker = brokerAccounts.find(b => b.status === 'connected');
    if (!activeBroker) {
      toast.error('No connected broker found. Please link a broker account.');
      setShowBrokerModal(true);
      return;
    }

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type,
      entry_price: price,
      currentPrice: price,
      lot_size: parseFloat(lotSize),
      profit: 0,
      sl: sl || (slInput ? parseFloat(slInput) : undefined),
      tp: tp || (tpInput ? parseFloat(tpInput) : undefined),
      created_at: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      broker_id: activeBroker.id
    };
    
    setPendingTrade(newTrade);
    toast.info(`Trade execution requested. Please approve on your ${activeBroker.provider} platform or mobile app.`, {
      duration: 5000,
    });
  };

  const approveTrade = async (trade: Trade) => {
    const updatedTrade = { ...trade, status: 'OPEN' as const };
    
    try {
      const { error } = await supabase.from('trades').insert([{
        symbol: updatedTrade.symbol,
        type: updatedTrade.type,
        entry_price: updatedTrade.entry_price,
        lot_size: updatedTrade.lot_size,
        sl: updatedTrade.sl,
        tp: updatedTrade.tp,
        status: updatedTrade.status,
        broker_id: updatedTrade.broker_id,
        user_id: user?.id
      }]);

      if (error) throw error;

      setPendingTrade(null);
      
      ws.current?.send(JSON.stringify({
        type: 'PLACE_ORDER',
        order: updatedTrade
      }));

      toast.success(`Trade Approved: ${trade.type} ${trade.symbol} executed.`);
    } catch (error: any) {
      toast.error(`Failed to save trade: ${error.message}`);
    }
  };

  const rejectTrade = () => {
    setPendingTrade(null);
    toast.error('Trade execution cancelled.');
  };

  const handleCloseTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'CLOSED' })
        .eq('id', tradeId);

      if (error) throw error;
      toast.success('Trade closed successfully');
    } catch (error: any) {
      toast.error(`Failed to close trade: ${error.message}`);
    }
  };

  useEffect(() => {
    // Throttle trade updates to avoid excessive re-renders
    const timer = setInterval(() => {
      setTrades(prev => prev.map(trade => {
        if (trade.status === 'OPEN') {
          const currentPrice = prices[trade.symbol] || trade.entry_price;
          const diff = trade.type === 'BUY' ? currentPrice - trade.entry_price : trade.entry_price - currentPrice;
          
          let multiplier = 100000;
          if (trade.symbol.includes('JPY')) multiplier = 1000;
          if (trade.symbol === 'XAU/USD') multiplier = 100;
          if (trade.symbol === 'BTC/USD') multiplier = 1;
          
          // Check SL/TP
          let status = trade.status;
          if (trade.sl) {
            if (trade.type === 'BUY' && currentPrice <= trade.sl) status = 'CLOSED';
            if (trade.type === 'SELL' && currentPrice >= trade.sl) status = 'CLOSED';
          }
          if (trade.tp) {
            if (trade.type === 'BUY' && currentPrice >= trade.tp) status = 'CLOSED';
            if (trade.type === 'SELL' && currentPrice <= trade.tp) status = 'CLOSED';
          }

          if (status === 'CLOSED' && trade.status === 'OPEN') {
            toast.info(`${trade.symbol} trade closed at ${status === 'CLOSED' ? (trade.sl ? 'SL' : 'TP') : 'Market'}`);
          }

          return {
            ...trade,
            currentPrice,
            profit: diff * trade.lot_size * multiplier,
            status
          };
        }
        return trade;
      }));
    }, 500);

    return () => clearInterval(timer);
  }, [prices]);

  useEffect(() => {
    setSelectedDrawingId(null);
    setIsDrawing(false);
  }, [activeSymbol]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      setIsLoggedIn(false);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#131722] flex items-center justify-center p-6">
        <Toaster position="top-right" theme="dark" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#1e222d] border border-[#2a2e39] p-8 space-y-6 rounded-lg shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#2962ff] rounded-xl mx-auto flex items-center justify-center shadow-xl shadow-[#2962ff]/20 mb-4">
                <TrendingUp className="text-white w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white font-sans">Capstone Terminal</h1>
              <p className="text-[#d1d4dc] text-sm">Institutional Grade Trading Access</p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#868993] font-bold uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#131722] border border-[#2a2e39] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#2962ff] text-[#d1d4dc] placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[#868993] font-bold uppercase tracking-widest">Password</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#131722] border border-[#2a2e39] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#2962ff] text-[#d1d4dc] placeholder:text-slate-600"
                />
              </div>
              
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-[#2962ff] text-white rounded font-bold hover:bg-[#1e4bd8] transition-all shadow-lg shadow-[#2962ff]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {isSignUp ? 'CREATE ACCOUNT' : 'CONNECT TERMINAL'}
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-[#2962ff] font-bold hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
            
            <p className="text-[10px] text-center text-[#868993]">
              By connecting, you agree to our Terms of Service and Risk Disclosure.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#131722] text-[#d1d4dc] font-sans selection:bg-[#2962ff]/30 overflow-hidden">
      <Toaster position="top-right" theme="dark" />
      
      {/* Top Toolbar */}
      <header className="h-10 border-b border-[#2a2e39] flex items-center justify-between px-2 bg-[#131722] shrink-0">
        <div className="flex items-center h-full">
          <div className="flex items-center gap-1 px-2 border-r border-[#2a2e39] h-full">
            <div className="w-6 h-6 bg-[#2962ff] rounded flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-bold text-[14px] text-white ml-1">{activeSymbol}</span>
            <ChevronDown size={14} className="text-[#868993]" />
          </div>
          
          <div className="flex items-center h-full px-1 border-r border-[#2a2e39]">
            {['1m', '5m', '15m', '1h', '4h', 'D'].map(tf => (
              <TVButton 
                key={tf}
                active={timeframe === tf} 
                onClick={() => setTimeframe(tf)}
                className="px-1.5"
              >
                {tf}
              </TVButton>
            ))}
          </div>

          <div className="flex items-center h-full px-4 gap-4 border-r border-[#2a2e39]">
            {[
              { id: 'Trading', icon: TrendingUp },
              { id: 'Portfolio', icon: Briefcase },
              { id: 'Analytics', icon: BarChart2 },
              { id: 'Signals', icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-[13px] font-bold transition-colors relative h-full flex items-center gap-1.5 px-1",
                  activeTab === tab.id ? "text-[#2962ff]" : "text-[#868993] hover:text-[#d1d4dc]"
                )}
              >
                <tab.icon size={14} />
                {tab.id}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2962ff]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center h-full px-1 border-r border-[#2a2e39]">
            <TVIconButton 
              icon={ChartCandlestick} 
              size={16} 
              active={chartType === 'candle'}
              onClick={() => setChartType('candle')}
            />
            <TVIconButton 
              icon={TrendingUp} 
              size={16} 
              active={chartType === 'line'}
              onClick={() => setChartType('line')}
            />
          </div>

          <div className="flex items-center h-full px-1 border-r border-[#2a2e39]">
            <TVButton>Indicators</TVButton>
          </div>

          <div className="flex items-center h-full px-1 border-r border-[#2a2e39]">
            <TVIconButton icon={LayoutGrid} size={16} />
          </div>

          <div className="flex items-center h-full px-2 gap-3">
            <TVButton className="gap-1.5"><Bell size={14} /> Alert</TVButton>
            <TVButton className="gap-1.5"><History size={14} /> Replay</TVButton>
          </div>

          <div className="flex items-center h-full px-2 gap-1 border-l border-[#2a2e39]">
            <TVIconButton icon={Undo2} size={16} />
            <TVIconButton icon={Redo2} size={16} />
          </div>
        </div>

        <div className="flex items-center h-full gap-1">
          <div className="flex items-center h-full px-2 border-r border-[#2a2e39]">
            <TVIconButton icon={Layout} size={16} />
            <div className="flex flex-col items-start ml-2 leading-none">
              <span className="text-[11px] text-[#d1d4dc]">Unnamed</span>
              <span className="text-[9px] text-[#868993]">Save</span>
            </div>
            <ChevronDown size={12} className="text-[#868993] ml-1" />
          </div>
          
          <TVIconButton icon={Search} size={16} />
          <TVIconButton icon={Settings} size={16} onClick={() => setShowSettings(true)} />
          <TVIconButton icon={Maximize2} size={16} />
          <TVIconButton icon={Camera} size={16} />
          
          <button className="bg-[#2962ff] hover:bg-[#1e4bd8] text-white px-3 py-1 rounded text-[13px] font-bold ml-2">
            Trade
          </button>
          <button className="bg-[#1e222d] border border-[#2a2e39] text-[#d1d4dc] px-3 py-1 rounded text-[13px] font-bold ml-1">
            Publish
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-12 border-r border-[#2a2e39] flex flex-col items-center py-2 bg-[#131722] shrink-0">
          <TVIconButton 
            icon={MousePointer2} 
            active={selectedDrawingTool === 'cursor'} 
            onClick={() => setSelectedDrawingTool('cursor')}
            title="Cursor"
          />
          <TVIconButton 
            icon={TrendingUp} 
            active={selectedDrawingTool === 'line'} 
            onClick={() => {
              setSelectedDrawingTool('line');
              setDrawingType('line');
            }}
            title="Trend Line"
          />
          <TVIconButton 
            icon={PenTool} 
            active={selectedDrawingTool === 'rect'} 
            onClick={() => {
              setSelectedDrawingTool('rect');
              setDrawingType('rect');
            }}
            title="Rectangle"
          />
          <TVIconButton 
            icon={LayoutGrid} 
            active={selectedDrawingTool === 'fib'} 
            onClick={() => {
              setSelectedDrawingTool('fib');
              setDrawingType('fib');
            }}
            title="Fibonacci Retracement"
          />
          <TVIconButton 
            icon={Brush} 
            active={selectedDrawingTool === 'brush'} 
            onClick={() => {
              setSelectedDrawingTool('brush');
              setDrawingType('brush');
            }}
            title="Brush"
          />
          <TVIconButton 
            icon={Type} 
            active={selectedDrawingTool === 'text'} 
            onClick={() => {
              setSelectedDrawingTool('text');
              setDrawingType('text');
            }}
            title="Text"
          />
          <TVIconButton 
            icon={Shapes} 
            active={selectedDrawingTool === 'shapes'} 
            onClick={() => setSelectedDrawingTool('shapes')}
            title="Shapes"
          />
          <div className="w-6 h-[1px] bg-[#2a2e39] my-2" />
          <TVIconButton icon={Ruler} title="Measure" />
          <TVIconButton icon={ZoomIn} title="Zoom In" />
          <TVIconButton 
            icon={Briefcase} 
            active={activeTab === 'Portfolio'} 
            onClick={() => setActiveTab('Portfolio')} 
            title="Portfolio"
          />
          <div className="flex-1" />
          <TVIconButton 
            icon={Magnet} 
            active={isMagnetEnabled} 
            onClick={() => setIsMagnetEnabled(!isMagnetEnabled)} 
            title="Magnet Mode"
          />
          <TVIconButton 
            icon={isLockEnabled ? Lock : Unlock} 
            onClick={() => setIsLockEnabled(!isLockEnabled)} 
            title="Lock All Drawings"
          />
          <TVIconButton 
            icon={areDrawingsHidden ? EyeOff : Eye} 
            onClick={() => setAreDrawingsHidden(!areDrawingsHidden)} 
            title="Hide All Drawings"
          />
          <TVIconButton icon={Trash2} onClick={() => setDrawings([])} title="Remove All Drawings" />
        </aside>

        {/* Main Chart Area */}
        <main className="flex-1 flex flex-col bg-[#131722] relative overflow-y-auto">
          {activeTab === 'Trading' || activeTab === 'Charts' ? (
            <div className="flex-1 relative flex flex-col">
                {/* Chart Overlay Info */}
                <div className="absolute top-2 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <img src={`https://flagcdn.com/w20/${activeSymbol.slice(0, 2).toLowerCase()}.png`} className="w-4 h-3 rounded-sm" alt="Flag" referrerPolicy="no-referrer" />
                    <span className="text-[13px] font-bold text-[#131722]">{activeSymbol} · {timeframe} · OANDA</span>
                    <div className="w-2 h-2 rounded-full bg-[#089981]" />
                    <span className={cn(
                      "text-[12px] font-medium",
                      (chartData[chartData.length - 1]?.close >= chartData[chartData.length - 1]?.open) ? "text-[#089981]" : "text-[#f23645]"
                    )}>
                      O{prices[activeSymbol]?.toFixed(5)} H{(prices[activeSymbol] * 1.001).toFixed(5)} L{(prices[activeSymbol] * 0.999).toFixed(5)} C{prices[activeSymbol]?.toFixed(5)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-0.5 pointer-events-auto">
                    <div 
                      onClick={() => handlePlaceOrder('SELL')}
                      className="flex items-center bg-[#f23645] text-white rounded-l px-2 py-1 gap-2 cursor-pointer hover:bg-[#d12e3b] shadow-sm transition-colors"
                    >
                      <span className="text-[14px] font-bold">{prices[activeSymbol]?.toFixed(5)}</span>
                      <span className="text-[10px] font-bold">SELL</span>
                    </div>
                    <div className="bg-white text-[#131722] px-2 py-1 text-[11px] font-bold border-x border-[#f0f3fa]">
                      1.4
                    </div>
                    <div 
                      onClick={() => handlePlaceOrder('BUY')}
                      className="flex items-center bg-[#2962ff] text-white rounded-r px-2 py-1 gap-2 cursor-pointer hover:bg-[#1e4bd8] shadow-sm transition-colors"
                    >
                      <span className="text-[14px] font-bold">{prices[activeSymbol]?.toFixed(5)}</span>
                      <span className="text-[10px] font-bold">BUY</span>
                    </div>
                  </div>
                </div>

                <div className="h-[500px] shrink-0 relative pt-10 bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2962ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="0" stroke="#f0f3fa" vertical={true} />}
                        <XAxis 
                          dataKey="timestamp" 
                          tick={{ fontSize: 10, fill: '#868993' }} 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(val) => {
                            const date = new Date(val);
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                          }}
                          minTickGap={50}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          tick={{ fontSize: 11, fill: '#131722' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ stroke: '#131722', strokeWidth: 1, strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f0f3fa', borderRadius: '4px' }}
                          itemStyle={{ color: '#2962ff', fontSize: '12px' }}
                          labelStyle={{ display: 'none' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#2962ff" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          isAnimationActive={false}
                          dot={false}
                        />
                      </AreaChart>
                    ) : (
                      <ComposedChart data={chartData} barGap="-100%">
                        {showGrid && <CartesianGrid strokeDasharray="0" stroke="#f0f3fa" vertical={true} />}
                        <XAxis 
                          dataKey="timestamp" 
                          tick={{ fontSize: 10, fill: '#868993' }} 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(val) => {
                            const date = new Date(val);
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                          }}
                          minTickGap={50}
                        />
                        <YAxis 
                          yAxisId="price"
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          tick={{ fontSize: 11, fill: '#131722' }} 
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => val.toFixed(activeSymbol.includes('JPY') ? 3 : 5)}
                        />
                        {showRSI && (
                          <YAxis 
                            yAxisId="rsi"
                            domain={[0, 100]} 
                            orientation="left" 
                            tick={{ fontSize: 9, fill: '#868993' }} 
                            axisLine={false}
                            tickLine={false}
                            width={35}
                          />
                        )}
                        <Tooltip 
                          cursor={{ stroke: '#131722', strokeWidth: 1, strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f0f3fa', borderRadius: '4px' }}
                          itemStyle={{ color: '#2962ff', fontSize: '12px' }}
                          labelStyle={{ display: 'none' }}
                        />
                        {showRSI && <ReferenceLine yAxisId="rsi" y={70} stroke="#f23645" strokeDasharray="3 3" strokeOpacity={0.3} />}
                        {showRSI && <ReferenceLine yAxisId="rsi" y={30} stroke="#089981" strokeDasharray="3 3" strokeOpacity={0.3} />}
                        {showRSI && (
                          <Line 
                            yAxisId="rsi"
                            type="monotone" 
                            dataKey="rsi" 
                            stroke="#8b5cf6" 
                            strokeWidth={1} 
                            dot={false} 
                            isAnimationActive={false}
                            opacity={0.5}
                          />
                        )}
                        
                        {/* Pattern Markers */}
                        {showPatterns && (
                          <Scatter 
                            yAxisId="price"
                            dataKey="close"
                            data={chartData.filter(d => d.pattern)} 
                            fill="#2962ff"
                            shape={(props: any) => {
                              const { cx, cy } = props;
                              if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return null;
                              return (
                                <g>
                                  <circle cx={cx} cy={cy - 20} r={4} fill="#2962ff" />
                                  <path d={`M${cx} ${cy - 15} L${cx - 5} ${cy - 10} L${cx + 5} ${cy - 10} Z`} fill="#2962ff" />
                                </g>
                              );
                            }}
                          />
                        )}

                        {/* Wick */}
                        <Bar yAxisId="price" dataKey="wick" fill="#64748b" barSize={1} isAnimationActive={false}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-wick-${index}`} fill={entry.close >= entry.open ? '#089981' : '#f23645'} />
                          ))}
                        </Bar>
                        {/* Body */}
                        <Bar yAxisId="price" dataKey="body" barSize={10} isAnimationActive={false} strokeWidth={1}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-body-${index}`} 
                              fill={entry.close >= entry.open ? '#089981' : '#f23645'} 
                              stroke={entry.close >= entry.open ? '#05806c' : '#d12e3b'}
                            />
                          ))}
                        </Bar>
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>

                  {/* Drawing Layer (SVG Overlay) */}
                  <svg className="absolute inset-0 pointer-events-none w-full h-full">
                    {!areDrawingsHidden && drawings.map((d) => {
                      if (d.type === 'rect' && d.points.length >= 2) {
                        const x = Math.min(d.points[0].x, d.points[1].x);
                        const y = Math.min(d.points[0].y, d.points[1].y);
                        const w = Math.abs(d.points[1].x - d.points[0].x);
                        const h = Math.abs(d.points[1].y - d.points[0].y);
                        return (
                          <g key={d.id}>
                            <rect 
                              x={x} y={y} width={w} height={h} 
                              fill="#2962ff15" stroke="#2962ff" strokeWidth={1} 
                            />
                            {d.label && (
                              <text 
                                x={x + w/2} y={y + h/2} 
                                fill="#d1d4dc" 
                                fontSize={10} textAnchor="middle" alignmentBaseline="middle"
                                className="font-bold uppercase tracking-tighter opacity-50"
                              >
                                {d.label}
                              </text>
                            )}
                          </g>
                        );
                      }
                      if (d.type === 'line' && d.points.length >= 2) {
                        return (
                          <line 
                            key={d.id}
                            x1={d.points[0].x} y1={d.points[0].y} 
                            x2={d.points[1].x} y2={d.points[1].y} 
                            stroke="#f23645" strokeWidth={1.5} 
                          />
                        );
                      }
                      return null;
                    })}
                  </svg>
                </div>

                {/* Bottom Chart Controls */}
                <div className="h-9 border-t border-[#2a2e39] bg-[#131722] flex items-center justify-between px-2 shrink-0">
                  <div className="flex items-center gap-1">
                    {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map(range => (
                      <button key={range} className="px-2 py-1 text-[11px] font-bold text-[#868993] hover:text-[#d1d4dc]">{range}</button>
                    ))}
                    <div className="w-[1px] h-4 bg-[#2a2e39] mx-1" />
                    <TVIconButton icon={Clock} size={14} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#868993]">09:14:43 UTC</span>
                    <div className="w-[1px] h-4 bg-[#2a2e39]" />
                    <TVIconButton icon={Layout} size={14} />
                  </div>
                </div>

                {/* Bottom Grid */}
                <div className="p-4 space-y-6">
                  {/* Active Trades Section */}
                  <GlassCard className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        Active Trades
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Open P/L</p>
                          <p className={cn(
                            "text-sm font-bold",
                            trades.reduce((acc, t) => acc + (t.status === 'OPEN' ? t.profit : 0), 0) >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            ${trades.reduce((acc, t) => acc + (t.status === 'OPEN' ? t.profit : 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          {trades.filter(t => t.status === 'OPEN').length} Positions
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {trades.filter(t => t.status === 'OPEN').length === 0 ? (
                        <div className="py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-white/5">
                          <p className="text-xs text-slate-500">No active trades in this session</p>
                          <button 
                            onClick={() => handlePlaceOrder('BUY')}
                            className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-bold hover:bg-blue-500/20 transition-all"
                          >
                            OPEN NEW POSITION
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {trades.filter(t => t.status === 'OPEN').map(trade => (
                            <div key={trade.id} className="p-3 bg-slate-800/40 rounded-xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]",
                                  trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                )}>
                                  {trade.type}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-200">{trade.symbol}</p>
                                  <p className="text-[10px] text-slate-500">{trade.lot_size} Lots · {trade.entry_price.toFixed(5)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className={cn("text-xs font-bold", trade.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    ${trade.profit.toFixed(2)}
                                  </p>
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Floating P/L</p>
                                </div>
                                <button 
                                  onClick={() => handleCloseTrade(trade.id)}
                                  className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Pattern Scanner Split Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Scan className="w-4 h-4 text-emerald-400" />
                          High Confidence Patterns
                        </h3>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Confirmed</span>
                      </div>
                      <div className="space-y-2">
                        {patterns.filter(p => p.confidence >= 85).map(pattern => (
                          <div 
                            key={pattern.id} 
                            onClick={() => setActiveSymbol(pattern.symbol)}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-200">{pattern.name}</p>
                              <p className="text-[10px] text-slate-500">{pattern.symbol} · {pattern.timeframe}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-400">{pattern.confidence}%</p>
                              <p className="text-[10px] text-slate-500 capitalize">{pattern.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <GlassCard className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Scan className="w-4 h-4 text-blue-400" />
                          Emerging Patterns
                        </h3>
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Detected</span>
                      </div>
                      <div className="space-y-2">
                        {patterns.filter(p => p.confidence < 85).map(pattern => (
                          <div 
                            key={pattern.id} 
                            onClick={() => setActiveSymbol(pattern.symbol)}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-200">{pattern.name}</p>
                              <p className="text-[10px] text-slate-500">{pattern.symbol} · {pattern.timeframe}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-blue-400">{pattern.confidence}%</p>
                              <p className="text-[10px] text-slate-500 capitalize">{pattern.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </div>
            ) : activeTab === 'Portfolio' ? (
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: 'Total Equity', value: '$124,582.40', change: '+2.4%', icon: Wallet },
                    { label: 'Unrealized P/L', value: `+$${trades.filter(t => t.status === 'OPEN').reduce((acc, t) => acc + t.profit, 0).toFixed(2)}`, change: 'Live', icon: TrendingUp },
                    { label: 'Margin Used', value: '$4,200.00', change: '8.4%', icon: ShieldCheck },
                    { label: 'Available Margin', value: '$120,382.40', change: '91.6%', icon: Activity }
                  ].map((stat, i) => (
                    <GlassCard key={i} className="p-6 border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded",
                          stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                    </GlassCard>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <GlassCard className="col-span-2 p-8 border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Active Positions</h3>
                        <p className="text-xs text-slate-500">Real-time market exposure and performance</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-slate-800 rounded text-[10px] font-bold text-slate-300 hover:text-white">CLOSE ALL</button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {trades.filter(t => t.status === 'OPEN').length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                          <p className="text-slate-500 text-sm">No active positions</p>
                          <button onClick={() => setActiveTab('Trading')} className="mt-2 text-blue-400 text-xs font-bold hover:underline">Open a trade</button>
                        </div>
                      ) : (
                        trades.filter(t => t.status === 'OPEN').map(trade => (
                          <div key={trade.id} className="group p-4 bg-slate-800/20 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-1 h-12 rounded-full",
                                trade.type === 'BUY' ? "bg-emerald-500" : "bg-red-500"
                              )} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white">{trade.symbol}</span>
                                  <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded",
                                    trade.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                  )}>
                                    {trade.type}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                  {trade.lot_size} Lots @ {trade.entry_price.toFixed(5)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-12">
                              <div className="text-right">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Current Price</p>
                                <p className="text-xs font-mono font-bold text-slate-300">{(prices[trade.symbol] || trade.entry_price).toFixed(5)}</p>
                              </div>
                              <div className="text-right min-w-[100px]">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Profit/Loss</p>
                                <p className={cn(
                                  "text-sm font-black",
                                  trade.profit >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                  {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleCloseTrade(trade.id)}
                                className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
                              >
                                <Maximize2 className="w-4 h-4 rotate-45" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-8 border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trade History</h4>
                      <button className="text-[10px] text-blue-400 font-bold hover:underline">VIEW ALL</button>
                    </div>
                    <div className="space-y-4">
                      {trades.filter(t => t.status === 'CLOSED').slice(0, 5).map(trade => (
                        <div key={trade.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                              trade.profit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            )}>
                              {trade.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{trade.symbol}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">{new Date(trade.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-xs font-bold",
                              trade.profit >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                            </p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase">{trade.type}</p>
                          </div>
                        </div>
                      ))}
                      {trades.filter(t => t.status === 'CLOSED').length === 0 && (
                        <p className="text-center py-8 text-slate-600 text-xs">No history available</p>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            ) : activeTab === 'Analytics' ? (
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Performance Analytics</h3>
                  <p className="text-sm text-slate-500">Comprehensive analysis of your trading strategy</p>
                </div>
                <div className="flex gap-2">
                  {['7D', '30D', '90D', 'ALL'].map(tf => (
                    <button key={tf} className="px-3 py-1.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 hover:text-white transition-colors">
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Win Rate', value: `${trades.filter(t => t.status === 'CLOSED').length > 0 ? ((trades.filter(t => t.status === 'CLOSED' && t.profit > 0).length / trades.filter(t => t.status === 'CLOSED').length) * 100).toFixed(1) : '0.0'}%`, icon: Target, color: 'text-emerald-400' },
                  { label: 'Profit Factor', value: '1.84', icon: TrendingUp, color: 'text-blue-400' },
                  { label: 'Avg. Win', value: `$${trades.filter(t => t.status === 'CLOSED' && t.profit > 0).length > 0 ? (trades.filter(t => t.status === 'CLOSED' && t.profit > 0).reduce((acc, t) => acc + t.profit, 0) / trades.filter(t => t.status === 'CLOSED' && t.profit > 0).length).toFixed(2) : '0.00'}`, icon: ArrowUpRight, color: 'text-emerald-400' },
                  { label: 'Max Drawdown', value: '4.2%', icon: ArrowDownRight, color: 'text-red-400' }
                ].map((stat, i) => (
                  <GlassCard key={i} className="p-6 border-white/5">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                  </GlassCard>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                <GlassCard className="col-span-2 p-8 border-white/5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Equity Curve (USD)</h4>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trades.filter(t => t.status === 'CLOSED').map((t, i) => ({
                        index: i,
                        profit: trades.filter(t => t.status === 'CLOSED').slice(0, i + 1).reduce((acc, curr) => acc + curr.profit, 100000)
                      }))}>
                        <defs>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2962ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="index" hide />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          stroke="#868993" 
                          fontSize={10} 
                          tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', borderRadius: '8px' }}
                          itemStyle={{ color: '#d1d4dc', fontSize: '12px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#2962ff" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProfit)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-white/5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Asset Distribution</h4>
                  <div className="space-y-6">
                    {[
                      { asset: 'Forex', percentage: 65, color: 'bg-blue-500' },
                      { asset: 'Crypto', percentage: 20, color: 'bg-emerald-500' },
                      { asset: 'Metals', percentage: 10, color: 'bg-amber-500' },
                      { asset: 'Indices', percentage: 5, color: 'bg-purple-500' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-slate-400">{item.asset}</span>
                          <span className="text-slate-200">{item.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
            ) : activeTab === 'Signals' ? (
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Signal Intelligence</h3>
                  <p className="text-sm text-slate-500">Real-time algorithmic trading signals</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Engine</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {signals.map(signal => (
                  <GlassCard key={signal.id} className={cn(
                    "p-6 border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden",
                    signal.isHighConviction && "border-blue-500/30 bg-blue-500/5"
                  )}>
                    {signal.isHighConviction && (
                      <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500 text-[8px] font-black uppercase tracking-widest text-white">
                        High Conviction
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                          signal.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {signal.type === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white tracking-tight">{signal.symbol}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{signal.time} ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Confidence</p>
                        <p className="text-lg font-black text-blue-400">{signal.confidence}%</p>
                      </div>
                    </div>

                    {signal.reason && (
                      <div className="mb-4 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-white/5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Logic</p>
                        <p className="text-[11px] font-bold text-blue-400">{signal.reason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-center">Entry</p>
                        <p className="text-sm font-black text-slate-200 text-center">{signal.price.toFixed(5)}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-center">SL</p>
                        <p className="text-sm font-black text-red-400 text-center">{signal.sl.toFixed(5)}</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-center">TP</p>
                        <p className="text-sm font-black text-emerald-400 text-center">{signal.tp.toFixed(5)}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handlePlaceOrder(signal.type, signal.symbol, signal.price, signal.sl, signal.tp)}
                      className={cn(
                        "w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                        signal.type === 'BUY' 
                          ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" 
                          : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                      )}
                    >
                      Execute Signal
                    </button>
                  </GlassCard>
                ))}
              </div>
            </div>
            ) : null}
        </main>

          {/* Right Sidebar */}
          <aside className="w-[300px] border-l border-[#2a2e39] bg-[#131722] flex flex-col shrink-0">
            {rightPanel === 'watchlist' ? (
              <>
                {/* Watchlist Header */}
                <div className="h-12 border-b border-[#2a2e39] flex items-center justify-between px-4">
                  <span className="text-[13px] font-bold text-[#d1d4dc]">Watchlist</span>
                  <div className="flex items-center gap-1">
                    <TVIconButton icon={Plus} size={16} />
                    <TVIconButton icon={ChevronDown} size={16} />
                  </div>
                </div>
                  
                {/* Watchlist Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2 text-[11px] font-bold text-[#868993] border-b border-[#2a2e39]">
                    <span>Symbol</span>
                    <span className="text-right">Last</span>
                    <span className="text-right">Chg%</span>
                  </div>
                  {Object.entries(prices).map(([symbol, price]) => (
                    <div 
                      key={symbol}
                      onClick={() => setActiveSymbol(symbol)}
                      className={cn(
                        "grid grid-cols-[1fr_80px_80px] px-4 py-3 text-[13px] cursor-pointer hover:bg-[#1e222d] transition-colors border-b border-[#2a2e39]/50",
                        activeSymbol === symbol && "bg-[#1e222d] border-l-2 border-l-[#2962ff]"
                      )}
                    >
                      <span className="font-bold text-[#d1d4dc]">{symbol}</span>
                      <span className="text-right font-mono text-[#d1d4dc]">{(price as number).toFixed(symbol.includes('JPY') ? 3 : 5)}</span>
                      <span className="text-right font-mono text-[#089981]">+0.12%</span>
                    </div>
                  ))}
                </div>

                {/* Symbol Details */}
                <div className="h-[250px] border-t border-[#2a2e39] bg-[#131722] p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[18px] font-bold text-[#d1d4dc]">{activeSymbol}</h3>
                    <span className="text-[12px] text-[#868993]">OANDA</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-[28px] font-bold text-[#d1d4dc]">{prices[activeSymbol]?.toFixed(5)}</span>
                    <span className="text-[14px] text-[#089981]">+0.00124 (+0.12%)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-[11px] text-[#868993] uppercase">Day's Range</p>
                      <div className="h-1 bg-[#2a2e39] rounded-full mt-1 relative">
                        <div className="absolute left-[40%] w-2 h-2 bg-[#d1d4dc] rounded-full -top-0.5" />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-[#868993]">
                        <span>{(prices[activeSymbol] * 0.995).toFixed(5)}</span>
                        <span>{(prices[activeSymbol] * 1.005).toFixed(5)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#868993] uppercase">52-Week Range</p>
                      <div className="h-1 bg-[#2a2e39] rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#868993]">Volume</span>
                      <span className="text-[#d1d4dc] font-bold">12.4K</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#868993]">Avg Volume (10)</span>
                      <span className="text-[#d1d4dc] font-bold">10.1K</span>
                    </div>
                  </div>
                </div>
              </>
            ) : rightPanel === 'details' ? (
              <div className="flex-1 flex flex-col">
                <div className="h-12 border-b border-[#2a2e39] flex items-center px-4">
                  <span className="text-[13px] font-bold text-[#d1d4dc]">Alerts Log</span>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {signals.map(signal => (
                    <div key={signal.id} className="p-3 bg-[#1e222d] rounded border border-[#2a2e39]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#d1d4dc]">{signal.symbol}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          signal.type === 'BUY' ? "bg-[#089981]/20 text-[#089981]" : "bg-[#f23645]/20 text-[#f23645]"
                        )}>{signal.type}</span>
                      </div>
                      <p className="text-[12px] text-[#868993]">Signal detected at {signal.price.toFixed(5)}</p>
                      <p className="text-[10px] text-[#868993] mt-1">{signal.time} ago</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="h-12 border-b border-[#2a2e39] flex items-center px-4">
                  <span className="text-[13px] font-bold text-[#d1d4dc]">Market News</span>
                </div>
                <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                  {[
                    { title: "Fed Chair Powell Hints at Rate Cuts Later This Year", time: "2h ago", source: "Reuters" },
                    { title: "Gold Hits Record High Amid Geopolitical Tensions", time: "4h ago", source: "Bloomberg" },
                    { title: "Oil Prices Steady as OPEC+ Extends Production Cuts", time: "6h ago", source: "CNBC" },
                    { title: "Japanese Yen Weakens Past 150 Level Against Dollar", time: "8h ago", source: "Nikkei" }
                  ].map((news, i) => (
                    <div key={i} className="space-y-1 group cursor-pointer">
                      <p className="text-[13px] font-bold text-[#d1d4dc] group-hover:text-[#2962ff] transition-colors leading-snug">
                        {news.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#868993]">
                        <span>{news.source}</span>
                        <span>•</span>
                        <span>{news.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Right Rail */}
          <div className="w-12 border-l border-[#2a2e39] bg-[#131722] flex flex-col items-center py-4 gap-4 shrink-0">
            <TVIconButton 
              icon={List} 
              size={20} 
              active={rightPanel === 'watchlist'} 
              onClick={() => setRightPanel('watchlist')}
              title="Watchlist"
            />
            <TVIconButton 
              icon={Bell} 
              size={20} 
              active={rightPanel === 'details'} 
              onClick={() => setRightPanel('details')}
              title="Alerts"
            />
            <TVIconButton 
              icon={Newspaper} 
              size={20} 
              active={rightPanel === 'news'} 
              onClick={() => setRightPanel('news')}
              title="News"
            />
            <TVIconButton icon={Clock} size={20} title="Object Tree" />
            <TVIconButton icon={Calendar} size={20} title="Economic Calendar" />
            <div className="flex-1" />
            <TVIconButton icon={Settings} size={20} onClick={() => setShowSettings(true)} title="Settings" />
          </div>
        </div>

      {/* Trade Approval Notification */}
      <AnimatePresence>
        {pendingTrade && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[60] w-80"
          >
            <div className="bg-[#1e222d] border-2 border-[#2962ff] rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-[#2962ff] px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Approval Required</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#868993] font-bold uppercase">Symbol</p>
                    <p className="text-sm font-bold text-white">{pendingTrade.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#868993] font-bold uppercase">Type</p>
                    <p className={cn(
                      "text-sm font-bold",
                      pendingTrade.type === 'BUY' ? "text-[#089981]" : "text-[#f23645]"
                    )}>{pendingTrade.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[#868993] font-bold uppercase">Price</p>
                    <p className="text-xs font-mono text-white">{pendingTrade.entry_price.toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#868993] font-bold uppercase">Lots</p>
                    <p className="text-xs font-mono text-white">{pendingTrade.lot_size}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => approveTrade(pendingTrade)}
                    className="flex-1 bg-[#089981] hover:bg-[#067d6a] text-white py-2 rounded font-bold text-xs transition-colors"
                  >
                    APPROVE
                  </button>
                  <button 
                    onClick={rejectTrade}
                    className="flex-1 bg-[#f23645]/10 hover:bg-[#f23645]/20 text-[#f23645] py-2 rounded font-bold text-xs transition-colors"
                  >
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broker Connection Modal */}
      <AnimatePresence>
        {showBrokerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 space-y-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#2962ff]" />
                    Link Broker Account
                  </h3>
                  <button onClick={() => setShowBrokerModal(false)} className="text-slate-500 hover:text-white">
                    <Trash2 size={18} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {['OANDA', 'MetaTrader', 'IG', 'IBKR'].map(provider => (
                      <button 
                        key={provider}
                        className="p-4 bg-[#131722] border border-[#2a2e39] rounded-xl hover:border-[#2962ff] transition-all text-center group"
                      >
                        <p className="text-xs font-bold text-[#d1d4dc] group-hover:text-[#2962ff]">{provider}</p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#868993] font-bold uppercase tracking-widest">Account ID / Login</label>
                      <input type="text" className="w-full bg-[#131722] border border-[#2a2e39] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#2962ff]" placeholder="e.g. 101-004-..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#868993] font-bold uppercase tracking-widest">API Key / Password</label>
                      <input type="password" className="w-full bg-[#131722] border border-[#2a2e39] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#2962ff]" placeholder="••••••••••••" />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      toast.success('Broker account linked successfully!');
                      setShowBrokerModal(false);
                    }}
                    className="w-full py-3 bg-[#2962ff] text-white rounded-xl font-bold hover:bg-[#1e4bd8] transition-all mt-4"
                  >
                    SIGN IN & CONNECT
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    Terminal Settings
                  </h3>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{user?.email}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Connected Terminal</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Logout
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase">Linked Broker Accounts</label>
                      <button 
                        onClick={() => setShowBrokerModal(true)}
                        className="text-[10px] text-[#2962ff] font-bold hover:underline"
                      >
                        + LINK NEW
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {brokerAccounts.map(account => (
                        <button 
                          key={account.id}
                          onClick={() => {
                            setBrokerAccounts(prev => prev.map(b => 
                              b.id === account.id 
                                ? { ...b, status: 'connected' }
                                : { ...b, status: 'disconnected' }
                            ));
                            setSelectedBroker(account.name);
                            toast.success(`Switched to ${account.name}`);
                          }}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all flex items-center justify-between group",
                            account.status === 'connected' 
                              ? "bg-blue-500/10 border-blue-500/50" 
                              : "bg-slate-800 border-white/5 hover:border-white/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              account.status === 'connected' ? "bg-[#089981]" : "bg-[#868993]"
                            )} />
                            <div>
                              <p className={cn(
                                "text-xs font-bold",
                                account.status === 'connected' ? "text-blue-400" : "text-slate-300"
                              )}>{account.name}</p>
                              <p className="text-[10px] text-slate-500">{account.provider} • {account.accountId}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-slate-300">${account.balance.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                              {account.status === 'connected' ? 'Active' : 'Switch'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Display Preferences</label>
                    <label className="text-xs font-bold text-slate-500 uppercase">Chart Preferences</label>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <span className="text-sm">Show Grid Lines</span>
                      <button 
                        onClick={() => setShowGrid(!showGrid)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          showGrid ? "bg-blue-500" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          showGrid ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <span className="text-sm">Show RSI Indicator</span>
                      <button 
                        onClick={() => setShowRSI(!showRSI)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          showRSI ? "bg-blue-500" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          showRSI ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <span className="text-sm">Show Patterns</span>
                      <button 
                        onClick={() => setShowPatterns(!showPatterns)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          showPatterns ? "bg-blue-500" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          showPatterns ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                >
                  SAVE CONFIGURATION
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Alert */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 w-80 hidden md:block"
        >
          <GlassCard className="p-4 border-l-4 border-emerald-500 shadow-emerald-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-tighter">Live Buy Signal</h4>
                <p className="text-[10px] text-slate-500">EUR/USD · 15m · MT5 Bridge</p>
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Entry:</span>
                <span className="text-slate-200 font-mono font-bold">{prices['EUR/USD']?.toFixed(5)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Risk:Reward:</span>
                <span className="text-emerald-400 font-bold">1:3.5</span>
              </div>
            </div>
            <button 
              onClick={() => handlePlaceOrder('BUY', 'EUR/USD', prices['EUR/USD'], prices['EUR/USD'] * 0.995, prices['EUR/USD'] * 1.01)}
              className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              EXECUTE NOW
            </button>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
