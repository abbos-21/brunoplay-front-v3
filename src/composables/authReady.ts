/** Resolves once the first sign-in attempt has finished, so screens never call the API before they have a token. */
let done: () => void = () => {};
export const authReady = new Promise<void>((resolve) => {
  done = resolve;
});
export const markAuthReady = () => done();
