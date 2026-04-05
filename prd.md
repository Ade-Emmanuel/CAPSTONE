# Product Requirements Document (PRD) - NexTrade Pro

## 1. Product Overview
NexTrade Pro is a high-performance, web-based trading terminal designed for retail traders who require real-time technical analysis, automated pattern recognition, and seamless broker integration. The platform provides a "Glassmorphism" inspired interface that balances aesthetic appeal with professional-grade data density.

## 2. Target Audience
- **Day Traders**: Users who need real-time price action and quick execution.
- **Technical Analysts**: Users who rely on indicators (RSI) and chart patterns.
- **Signal Followers**: Users who want to monitor automated trade signals and pattern scanners.

## 3. Key Features

### 3.1. Advanced Charting Engine
- **Multi-Type Support**: Toggle between Line charts and OHLC Candlestick charts.
- **Technical Indicators**: Integrated RSI (Relative Strength Index) with overbought/oversold reference lines.
- **Pattern Recognition**: Automated detection of 18+ classic chart patterns (Head and Shoulders, Double Top/Bottom, Triangles, Wedges, etc.).
- **Live Scanner**: Real-time pattern scanner that identifies "Forming" and "Confirmed" setups with confidence scores.
- **Smart Notifications**: Instant toast notifications when a pattern begins forming or completes, including timeframe and confidence details.
- **Drawing Tools**: Interactive trendlines and support/resistance rectangle zones.
- **Real-time Updates**: WebSocket-driven price updates with zero-latency rendering.
- **Zooming & Navigation**: Dedicated zoom buttons and mouse wheel support to adjust chart density (10-100 candles).

### 3.2. Trade Execution
- **Order Panel**: Quick Buy/Sell execution with configurable lot sizes.
- **Risk Management**: Input fields for Stop Loss (SL) and Take Profit (TP).
- **Broker Bridge**: Support for multiple broker backends including MT5 Bridge, TradingView Pro, and IBKR Direct.

### 3.3. Market Intelligence
- **Signal Feed**: Real-time trade signals with confidence scores and timeframe analysis.
- **Pattern Scanner**: Live scanner that detects forming and confirmed patterns across multiple symbols.
- **Real-time Sync**: Supabase integration for cross-session data persistence and live trade tracking.

### 3.4. User Experience
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile views.
- **Customization**: Toggleable grid lines, indicators, and pattern overlays via the Settings menu.
- **Visual Feedback**: Toast notifications for trade execution, drawing additions, and symbol changes.

## 4. User Interface (UI)
- **Theme**: Dark-mode "Glass" aesthetic using Tailwind CSS.
- **Typography**: Inter (Sans) for UI and JetBrains Mono for financial data.
- **Layout**: 
  - Sidebar for navigation and account stats.
  - Main viewport for the charting engine.
  - Right-side panel for order execution and signals.
  - Bottom grid for pattern scanning and database status.

## 5. Technical Stack
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion (motion/react).
- **Data Visualization**: Recharts (ComposedChart, Area, Bar, Scatter).
- **Backend/Real-time**: Supabase (PostgreSQL + Realtime), WebSockets.
- **Notifications**: Sonner.

## 6. Future Roadmap
- **Strategy Tester**: Backtesting engine for custom trading strategies.
- **Multi-Chart View**: Ability to view 4 charts simultaneously.
- **AI Assistant**: Gemini-powered market sentiment analysis and trade journaling.
- **Mobile App**: Native wrapper for iOS and Android deployment.
