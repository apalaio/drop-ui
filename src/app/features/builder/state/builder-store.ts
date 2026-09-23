import { signalStore, withState } from '@ngrx/signals';
import { PaletteItem } from '../models/palette-item';

interface BuilderState {
  paletteItems: PaletteItem[];
}

const createInitialState = (): BuilderState => ({
  paletteItems: [{ uid: crypto.randomUUID(), type: 'div', label: 'Div' }],
});

export const BuilderStore = signalStore({ providedIn: 'root' }, withState(createInitialState));
