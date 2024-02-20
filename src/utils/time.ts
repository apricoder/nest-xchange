export const wait = (millis: number = 1000): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => resolve(), millis);
  });
};
