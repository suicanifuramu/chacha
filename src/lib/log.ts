// Dev-gated console wrapper.
// Use logger.debug / logger.info for diagnostic logs that should not appear in
// production builds. Genuine warnings/errors stay on direct console.warn /
// console.error calls so they surface in user devtools and any error reporters.

const isDev = import.meta.env.DEV

export const logger = {
  debug(...args: unknown[]): void {
    if (isDev) console.log(...args)
  },
  info(...args: unknown[]): void {
    if (isDev) console.info(...args)
  },
}
