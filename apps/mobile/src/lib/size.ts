// Window size classes, as in the design handoff and Material's guidance.
// compact (< 600): phone flow, one screen at a time.
// medium (600 to 839): search and calendar side by side; the day opens on its own.
// expanded (840 and up): search, calendar and day in three panes.

export type Size = 'compact' | 'medium' | 'expanded';

export const sizeFor = (width: number): Size => (width < 600 ? 'compact' : width < 840 ? 'medium' : 'expanded');
