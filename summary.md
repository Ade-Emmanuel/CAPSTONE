# Project Summary - Chart Enhancements

This update restores and enhances the technical analysis capabilities of the trading chart.

## Key Features Added

### 1. Technical Indicators
- **RSI (Relative Strength Index)**: 
  - Implemented a real-time 14-period RSI calculation.
  - Added a secondary Y-axis (0-100) on the left side of the chart.
  - Visualized with a purple line and dashed reference lines at 70 (Overbought) and 30 (Oversold).
- **Pattern Recognition Markers**:
  - Added blue "pin" markers directly on the candlesticks where patterns are detected.
  - **Expanded Library**: Now detects 18+ classic patterns including Head & Shoulders, Wedges, Triangles, and more.
  - **Live Scanner**: Real-time identification of "Forming" vs "Confirmed" setups.
  - **Smart Notifications**: Instant alerts when a high-probability shape is detected.

### 2. UI/UX Improvements
- **Dynamic Overlays**: Bullish/Bearish pattern labels now pulse in the top-left corner of the chart when a pattern is confirmed or forming.
- **Chart Preferences**: Added a new section in the **Settings** menu to toggle:
  - **Grid Lines**: Show/hide the background grid.
  - **RSI Indicator**: Show/hide the RSI line and axis.
  - **Patterns**: Show/hide pattern markers and overlays.
- **Zooming & Navigation**: Added dedicated Zoom In/Out buttons and mouse wheel support to adjust chart density (10-100 candles).

### 3. Technical Implementation
- **Recharts Integration**: Switched to a multi-axis `ComposedChart` to support overlapping price data, RSI, and scatter markers.
- **State Management**: Added persistent toggles for chart features to allow for a cleaner workspace.
- **Memoized Calculations**: RSI and pattern matching are calculated within `useMemo` to ensure high performance during real-time price updates.

## How to Use
1. Open the **Settings** (gear icon) to toggle indicators and grid lines.
2. Switch between **Line** and **Candlestick** views using the "Charts" dropdown.
3. Use the **Tools** menu to draw trendlines and support/resistance zones directly on the chart.
