import "@testing-library/jest-dom";

// jsdom doesn't implement ResizeObserver, which Recharts' ResponsiveContainer
// relies on. A minimal no-op polyfill is enough for these smoke tests.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

