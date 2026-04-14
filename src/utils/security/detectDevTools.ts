/**
 * DevTools detection utility
 * Detects if browser Developer Tools are open using multiple methods
 */

/**
 * Detects if DevTools is open using multiple methods
 * @returns true if DevTools detected, false otherwise
 */
export function detectDevTools(): boolean {
  try {
    // Method 1: Window size difference
    // Normalize innerWidth/Height by devicePixelRatio so browser zoom (Ctrl +/-)
    // doesn't produce a false positive. When zoomed, innerWidth shrinks in CSS pixels
    // while outerWidth stays constant, which previously tripped the threshold.
    const zoom = window.devicePixelRatio || 1;
    const widthDiff = window.outerWidth - window.innerWidth * zoom;
    const heightDiff = window.outerHeight - window.innerHeight * zoom;
    const widthThreshold = widthDiff > 200;
    const heightThreshold = heightDiff > 200;

    if (widthThreshold || heightThreshold) {
      return true;
    }

    // Method 2: Debugger trap (with timeout)
    let devtoolsOpen = false;
    const before = Date.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const after = Date.now();
    if (after - before > 100) {
      devtoolsOpen = true;
    }

    // Method 3: Console detection (check toString behavior)
    const element = new Image();
    let consoleOpen = false;
    Object.defineProperty(element, "id", {
      get: function () {
        consoleOpen = true;
        return "";
      },
    });
    element.toString();

    return devtoolsOpen || consoleOpen;
  } catch (error) {
    // If detection fails, return false (don't break the app)
    console.error("[DevTools Detection] Error:", error);
    return false;
  }
}
