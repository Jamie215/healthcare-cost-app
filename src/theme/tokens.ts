// Design tokens carried over from prototype/styles.css (:root custom properties).

export const colors = {
  blue700: '#002f44',
  blue600: '#003d60',
  blue500: '#005586', // primary
  blue300: '#0076ba', // focus ring
  blueScreen: '#004973',
  surface: '#ffffff',
  page: '#f9f9f9',
  border: '#e3e3e3',
  text: '#000000',
  muted: '#535353', // placeholder and secondary text
  error: '#880000',
  success: '#008839',
} as const;

export const space = { 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32 } as const;

export const radius = { button: 5, input: 10, numberInput: 4, card: 10 } as const;

export const fontSize = { body: 14, label: 14, title: 20, heading: 24, amount: 28 } as const;
