import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement
} from 'react';

import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Menu/menu';

import { VirtualGrid } from './VirtualGrid';
import accessibilityOverscanIndicesGetter from './accessibilityOverscanIndicesGetter';
import type { Alignment, CellRendererParams, CellSize, OverscanIndicesGetter, RenderedSection } from './types';

const DEFAULT_ROW_HEIGHT = 36;
const DEFAULT_MAX_HEIGHT = 300;
const DEFAULT_OVERSCAN_ROW_COUNT = 5;

export interface VirtualSelectListRowRendererParams {
  /** Zero-based index of the row */
  index: number;
  /** Style object that MUST be applied to the rendered element for correct positioning */
  style: React.CSSProperties;
  /** Unique key for the row */
  key: string;
  /** Whether the list is currently being scrolled */
  isScrolling: boolean;
  /** Whether the row is within the visible viewport (vs. overscan) */
  isVisible: boolean;
}

export interface VirtualSelectListProps {
  /** Total number of rows in the list. */
  rowCount: number;

  /**
   * Renderer function for each row. Must return a SelectOption, MenuItem, or compatible element.
   * The `style` parameter MUST be applied to the rendered element for correct positioning.
   */
  rowRenderer: (params: VirtualSelectListRowRendererParams) => ReactElement;

  /**
   * Height of each row in pixels.
   * Can be a fixed number or a function that returns the height for a given index.
   * If a function is provided, memoize it (e.g. with useCallback) to avoid
   * recalculating total height on every render.
   * Defaults to 36 (PatternFly's standard menu item height).
   */
  rowHeight?: CellSize;

  /**
   * Maximum height of the scrollable list in pixels.
   * The list will be shorter if total content height is less than maxHeight.
   * Defaults to 300.
   */
  maxHeight?: number;

  /** Optional CSS class name applied to the list container. */
  className?: string;

  /** Optional inline style applied to the list container. */
  style?: React.CSSProperties;

  /**
   * Indicates to assistive technologies whether more than one row can be selected.
   * Maps to aria-multiselectable on the list element.
   */
  isAriaMultiselectable?: boolean;

  /** Accessible label for the list. */
  'aria-label'?: string;

  /**
   * Index to scroll to. When set, the list scrolls to ensure this index is visible.
   * Use -1 (default) to disable.
   */
  scrollToIndex?: number;

  /** Scroll-to alignment behavior. Defaults to 'auto'. */
  scrollToAlignment?: Alignment;

  /** Number of rows to render above/below the visible area. Defaults to 5. */
  overscanRowCount?: number;

  /** Custom overscan indices getter for accessibility. */
  overscanIndicesGetter?: OverscanIndicesGetter;

  /** Callback when the visible range changes. */
  onRowsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    startIndex: number;
    stopIndex: number;
  }) => void;

  /** Renderer for empty state when rowCount is 0. */
  noRowsRenderer?: () => ReactElement;
}

export interface VirtualSelectListRef {
  scrollToItem: (index: number) => void;
}

/**
 * A virtualized list component designed to replace PatternFly's SelectList
 * inside a composable Select. Renders only visible items for high performance
 * with large option counts.
 */
export const VirtualSelectList = forwardRef<VirtualSelectListRef, VirtualSelectListProps>(
  (
    {
      rowCount,
      rowRenderer,
      rowHeight = DEFAULT_ROW_HEIGHT,
      maxHeight = DEFAULT_MAX_HEIGHT,
      className,
      style: styleProp,
      isAriaMultiselectable = false,
      'aria-label': ariaLabel,
      scrollToIndex: scrollToIndexProp = -1,
      scrollToAlignment = 'auto',
      overscanRowCount = DEFAULT_OVERSCAN_ROW_COUNT,
      overscanIndicesGetter = accessibilityOverscanIndicesGetter,
      onRowsRendered,
      noRowsRenderer
    },
    ref
  ) => {
    const gridRef = useRef<VirtualGrid>(null);
    const containerRef = useRef<HTMLElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const keyDownHandlerRef = useRef<(e: KeyboardEvent<HTMLElement>) => void>(null);

    const scrollToIndex = scrollToIndexProp >= 0 ? scrollToIndexProp : focusedIndex;

    const totalHeight = useMemo(() => {
      if (typeof rowHeight === 'number') {
        return rowCount * rowHeight;
      }
      let sum = 0;
      for (let i = 0; i < rowCount; i++) {
        sum += rowHeight({ index: i });
      }
      return sum;
    }, [rowCount, rowHeight]);

    const height = Math.min(maxHeight, totalHeight) || 1;

    useImperativeHandle(
      ref,
      () => ({
        scrollToItem: (index: number) => {
          if (gridRef.current) {
            gridRef.current.scrollToCell({ columnIndex: 0, rowIndex: index });
          }
        }
      }),
      []
    );

    useEffect(() => {
      if (focusedIndex < 0 || !containerRef.current) {
        return;
      }
      const focusableItems = containerRef.current.querySelectorAll<HTMLElement>(
        'li button:not(:disabled), li input:not(:disabled), li a:not(:disabled)'
      );
      for (let i = 0; i < focusableItems.length; i++) {
        const item = focusableItems[i];
        const li = item.closest('li');
        if (li) {
          const rowIndex = parseInt(li.getAttribute('data-row-index') ?? '', 10);
          if (rowIndex === focusedIndex) {
            item.focus();
            break;
          }
        }
      }
    }, [focusedIndex]);

    keyDownHandlerRef.current = (e: KeyboardEvent<HTMLElement>) => {
      if (rowCount === 0) {
        return;
      }
      let nextIndex = focusedIndex;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          nextIndex = Math.min(focusedIndex + 1, rowCount - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          nextIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          e.stopPropagation();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          e.stopPropagation();
          nextIndex = rowCount - 1;
          break;
        default:
          return;
      }
      setFocusedIndex(nextIndex);
      if (gridRef.current) {
        gridRef.current.scrollToCell({ columnIndex: 0, rowIndex: nextIndex });
      }
    };

    const stableKeyDownHandler = useCallback((e: KeyboardEvent<HTMLElement>) => {
      keyDownHandlerRef.current?.(e);
    }, []);

    const cellRenderer = useCallback(
      ({ rowIndex, style: cellStyle, isScrolling, isVisible, key }: CellRendererParams) => {
        const { writable } = Object.getOwnPropertyDescriptor(cellStyle, 'width') || {};
        if (writable) {
          cellStyle.width = '100%';
        }
        const element = rowRenderer({
          index: rowIndex,
          style: cellStyle,
          isScrolling,
          isVisible,
          key
        });
        return cloneElement(element, { 'data-row-index': rowIndex });
      },
      [rowRenderer]
    );

    const handleSectionRendered = useCallback(
      ({ rowOverscanStartIndex, rowOverscanStopIndex, rowStartIndex, rowStopIndex }: RenderedSection) => {
        onRowsRendered?.({
          overscanStartIndex: rowOverscanStartIndex,
          overscanStopIndex: rowOverscanStopIndex,
          startIndex: rowStartIndex,
          stopIndex: rowStopIndex
        });
      },
      [onRowsRendered]
    );

    const setGridRef = useCallback((gridInstance: VirtualGrid) => {
      (gridRef as React.MutableRefObject<VirtualGrid | null>).current = gridInstance;
    }, []);

    // Stable scroll container component that doesn't change identity across renders.
    // Uses refs for values that change (ariaLabel, isAriaMultiselectable, keyDownHandler)
    // to avoid recreating the component and remounting VirtualGrid.
    const ariaLabelRef = useRef(ariaLabel);
    const isAriaMultiselectableRef = useRef(isAriaMultiselectable);
    ariaLabelRef.current = ariaLabel;
    isAriaMultiselectableRef.current = isAriaMultiselectable;

    const ScrollContainer = useMemo(
      () =>
        forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>((props, scrollRef) => (
          <ul
            {...props}
            ref={(el) => {
              (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
              if (typeof scrollRef === 'function') {
                scrollRef(el);
              } else if (scrollRef) {
                (scrollRef as React.MutableRefObject<HTMLUListElement | null>).current = el;
              }
            }}
            role="listbox"
            aria-label={ariaLabelRef.current}
            {...(isAriaMultiselectableRef.current && { 'aria-multiselectable': true })}
            onKeyDown={stableKeyDownHandler as any}
          />
        )),
      [stableKeyDownHandler]
    );

    return (
      <VirtualGrid
        ref={setGridRef as any}
        autoContainerWidth
        cellRenderer={cellRenderer}
        className={css(styles.menuList, className)}
        columnCount={1}
        columnWidth={9999}
        height={height}
        width={9999}
        innerScrollContainerClassName=""
        innerScrollContainerComponent="div"
        noContentRenderer={noRowsRenderer}
        onSectionRendered={handleSectionRendered}
        overscanIndicesGetter={overscanIndicesGetter}
        overscanRowCount={overscanRowCount}
        aria-readonly={null}
        containerRole="presentation"
        role={undefined}
        rowCount={rowCount}
        rowHeight={rowHeight}
        scrollContainerComponent={ScrollContainer}
        scrollToAlignment={scrollToAlignment}
        scrollToRow={scrollToIndex}
        style={{ width: '100%', boxSizing: 'content-box', ...styleProp }}
        tabIndex={0}
      />
    );
  }
);

VirtualSelectList.displayName = 'VirtualSelectList';
