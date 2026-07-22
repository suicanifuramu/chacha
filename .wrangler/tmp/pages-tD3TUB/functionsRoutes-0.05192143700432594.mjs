import { onRequest as __api___path___js_onRequest } from "C:\\Users\\chanhina\\Documents\\py-test\\chacha-dev\\app\\functions\\api\\[[path]].js"
import { onRequest as __cdn___path___js_onRequest } from "C:\\Users\\chanhina\\Documents\\py-test\\chacha-dev\\app\\functions\\cdn\\[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/cdn/:path*",
      mountPath: "/cdn",
      method: "",
      middlewares: [],
      modules: [__cdn___path___js_onRequest],
    },
  ]