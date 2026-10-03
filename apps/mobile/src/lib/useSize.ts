import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { LOOK } from '../theme';
import { sizeFor } from './size';

export function useSize() {
  return sizeFor(useWindowDimensions().width);
}

/** Space the floating iOS tab bar takes over the content. On tablets and Android it takes its own room. */
export function useTabSpace() {
  return LOOK === 'ios' && useSize() === 'compact' ? 96 : 0;
}

/** True inside the tabs when the tab bar sits at the top and already clears the status bar. */
export const TopCleared = createContext(false);
export const useTopCleared = () => useContext(TopCleared);
