import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // WebSocket Server for Live Price Ticks
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected to Price Feed");
    
    const prices: Record<string, number> = {
      "EUR/USD": 1.09234,
      "GBP/USD": 1.26780,
      "USD/JPY": 150.45,
      "AUD/USD": 0.65432,
      "USD/CAD": 1.35670,
      "USD/CHF": 0.88450,
      "NZD/USD": 0.61230,
      "EUR/GBP": 0.85450,
      "EUR/JPY": 164.20,
      "GBP/JPY": 191.50,
      "XAU/USD": 2034.50,
      "BTC/USD": 62450.00,
      "USD/MXN": 17.05,
      "EUR/CHF": 0.9540,
      "GBP/CHF": 1.1120,
      "AUD/JPY": 98.45,
      "NZD/JPY": 92.30,
      "CAD/JPY": 111.15,
      "EUR/AUD": 1.6680,
      "GBP/AUD": 1.9350,
      "XTI/USD": 78.45,
      "ETH/USD": 3450.00
    };

    const interval = setInterval(() => {
      Object.keys(prices).forEach(symbol => {
        let volatility = 0.0002;
        if (symbol.includes("JPY")) volatility = 0.02;
        if (symbol === "XAU/USD") volatility = 0.5;
        if (symbol === "BTC/USD") volatility = 15.0;
        if (symbol === "ETH/USD") volatility = 2.0;
        if (symbol === "XTI/USD") volatility = 0.1;
        if (symbol === "USD/MXN") volatility = 0.01;

        const change = (Math.random() - 0.5) * volatility;
        prices[symbol] += change;
        
        ws.send(JSON.stringify({
          type: "TICK",
          symbol: symbol,
          price: prices[symbol],
          timestamp: new Date().toISOString(),
          change: change > 0 ? "up" : "down"
        }));
      });
    }, 1000);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "PLACE_ORDER") {
          console.log("Order received:", data.order);
          // Simulate execution delay
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: "ORDER_FILLED",
              orderId: Math.random().toString(36).substr(2, 9),
              symbol: data.order.symbol,
              price: prices[data.order.symbol] || data.order.price,
              sl: data.order.sl,
              tp: data.order.tp,
              status: "success"
            }));
          }, 500);
        }
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    });

    ws.on("close", () => {
      clearInterval(interval);
      console.log("Client disconnected");
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Capstone Trading Terminal" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
