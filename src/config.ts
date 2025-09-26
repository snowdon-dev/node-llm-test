declare const __APP_VERSION__: string;

export const module_version =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
