/**
 * Determines which section index the current scroll position corresponds to
 * based on the layout heights array.
 *
 * @param scrollPosition - The current scroll position from the top
 * @param heights - Array of section heights [1112, 1112, 1112, 1112, 1268.8333740234375]
 * @returns The index of the current section (0-based)
 */
export function getCurrentSectionIndex(
  scrollPosition: number,
  heights: number[],
): number {
  if (!heights || heights.length === 0) {
    return 0;
  }

  // If scroll position is at or before the first section
  if (scrollPosition <= 0) {
    return 0;
  }

  let cumulativeHeight = 0;

  for (let i = 0; i < heights.length; i++) {
    cumulativeHeight += heights[i];

    // If scroll position is within this section
    if (scrollPosition <= cumulativeHeight) {
      return i;
    }
  }

  // If scroll position is beyond all sections, return the last index
  return heights.length - 1;
}

/**
 * Gets the scroll range (start and end positions) for a specific section index
 *
 * @param sectionIndex - The section index to get the range for
 * @param heights - Array of section heights
 * @returns Object with start and end scroll positions for the section
 */
export function getSectionScrollRange(
  sectionIndex: number,
  heights: number[],
): { start: number; end: number } {
  if (
    !heights || heights.length === 0 || sectionIndex < 0 ||
    sectionIndex >= heights.length
  ) {
    return { start: 0, end: 0 };
  }

  let start = 0;

  // Calculate start position by summing previous section heights
  for (let i = 0; i < sectionIndex; i++) {
    start += heights[i];
  }

  const end = start + heights[sectionIndex];

  return { start, end };
}

/**
 * Gets the progress (0-1) within the current section
 *
 * @param scrollPosition - The current scroll position
 * @param sectionIndex - The current section index
 * @param heights - Array of section heights
 * @returns Progress within the section (0 = start of section, 1 = end of section)
 */
export function getSectionProgress(
  scrollPosition: number,
  sectionIndex: number,
  heights: number[],
): number {
  const { start, end } = getSectionScrollRange(sectionIndex, heights);

  if (end === start) {
    return 0;
  }

  const progress = (scrollPosition - start) / (end - start);
  return Math.max(0, Math.min(1, progress));
}
