export {};

declare global {
  type settingsNames = 'spies' | 'players' | 'time';
  type settings = Record<settingsNames, number>;
  interface AlwatrSignals {
    readonly 'hide-tab-bar': boolean;
  }
}
