import { createContext } from 'react';

export const ViewModeContext = createContext({
  viewMode: 'map',
  setViewMode: () => {}
});
