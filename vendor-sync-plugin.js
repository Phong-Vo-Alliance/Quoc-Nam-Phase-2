/** @returns {import('vite').Plugin} */
export function vendorSyncPlugin() {
  return {
    name: "vendor-sync",
    apply: "serve",
    configureServer(server) {
      // Broadcast to ALL connected clients (including sender).
      // The sender ignores the echo via _sid on the client side.
      server.ws.on("vendor-sync", (data) => {
        server.ws.send({ type: "custom", event: "vendor-sync", data });
        console.log(`[vendor-sync] broadcast "${data?.type}"`);
      });

      server.ws.on("vendor-phone-reveal-sync", (data) => {
        server.ws.send({ type: "custom", event: "vendor-phone-reveal-sync", data });
        console.log(`[vendor-phone-reveal-sync] broadcast "${data?.type}"`);
      });

      console.log("[vendor-sync] relay ready");
    },
  };
}
