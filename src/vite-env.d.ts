/// <reference types="vite/client" />

// Virtual module injected by the Tempo Vite plugin at build time.
declare module "tempo-routes" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}
