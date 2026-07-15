import "@testing-library/jest-dom";

// jsdom doesn't implement ResizeObserver, which Recharts' ResponsiveContainer
// relies on. Report a non-zero size so charts don't warn during smoke tests.
class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            x: 0,
            y: 0,
            width: 800,
            height: 280,
            top: 0,
            left: 0,
            bottom: 280,
            right: 800,
            toJSON() {
              return {};
            },
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}
  disconnect() {}
}

(global as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;
