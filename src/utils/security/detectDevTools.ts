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
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

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
