/** Letter fills of the wordmark: green "Village", orange "to", blue "World". */
export const FILLS = {
  light: {
    village: 'linear-gradient(180deg, #d9f74a 0%, #8fdc2f 45%, #3fae2a 100%)',
    to: 'linear-gradient(180deg, #ffb23c 0%, #ff6a1a 100%)',
    world: 'linear-gradient(180deg, #6cc0ff 0%, #2a86f5 50%, #1160dc 100%)',
  },
  dark: {
    village: 'linear-gradient(180deg, #a4e34b 0%, #5cc02c 50%, #2f9a22 100%)',
    to: 'linear-gradient(180deg, #ffab38 0%, #ff7a12 100%)',
    world: 'linear-gradient(180deg, #4aa6ff 0%, #1f78ee 50%, #0d56c9 100%)',
  },
} as const;
