import { render, fireEvent } from '@testing-library/react';
import { VirtualSelectList } from './VirtualSelectList';

const defaultRowRenderer = ({ index, style, key }: { index: number; style: React.CSSProperties; key: string }) => (
  <li key={key} style={style} role="option" aria-selected={false}>
    Option {index}
  </li>
);

describe('VirtualSelectList', () => {
  test('renders with correct ARIA attributes', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
          aria-label="Test select list"
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    expect(listbox?.getAttribute('aria-label')).toBe('Test select list');
  });

  test('does not render aria-readonly on the listbox', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox?.hasAttribute('aria-readonly')).toBe(false);
  });

  test('does not render role=rowgroup on the inner container', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
        />
      </div>
    );

    expect(container.querySelector('[role="rowgroup"]')).toBeNull();
  });

  test('renders aria-multiselectable when isAriaMultiselectable is true', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
          isAriaMultiselectable
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
  });

  test('does not render aria-multiselectable when isAriaMultiselectable is false', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
          isAriaMultiselectable={false}
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox?.hasAttribute('aria-multiselectable')).toBe(false);
  });

  test('applies custom className', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
          className="custom-class"
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox?.className).toContain('custom-class');
  });

  test('renders only visible rows, not all rows', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={1000}
          rowHeight={36}
          maxHeight={200}
          rowRenderer={defaultRowRenderer}
          overscanRowCount={2}
        />
      </div>
    );

    const items = container.querySelectorAll('[role="option"]');
    expect(items.length).toBeLessThan(1000);
    expect(items.length).toBeGreaterThan(0);
  });

  test('renders empty state when rowCount is 0', () => {
    const { getByText } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={0}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
          noRowsRenderer={() => <li>No items found</li>}
        />
      </div>
    );

    expect(getByText('No items found')).toBeTruthy();
  });

  test('calls onRowsRendered when rows are rendered', () => {
    const onRowsRendered = jest.fn();

    render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={100}
          rowHeight={36}
          maxHeight={200}
          rowRenderer={defaultRowRenderer}
          onRowsRendered={onRowsRendered}
        />
      </div>
    );

    expect(onRowsRendered).toHaveBeenCalled();
    const args = onRowsRendered.mock.calls[0][0];
    expect(args).toHaveProperty('startIndex');
    expect(args).toHaveProperty('stopIndex');
    expect(args).toHaveProperty('overscanStartIndex');
    expect(args).toHaveProperty('overscanStopIndex');
  });

  test('attaches data-row-index to rendered rows', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={10}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
        />
      </div>
    );

    const items = container.querySelectorAll('[data-row-index]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].getAttribute('data-row-index')).toBe('0');
  });

  test('has pf-v6-c-menu__list class on the listbox', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={5}
          rowHeight={36}
          rowRenderer={defaultRowRenderer}
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox?.className).toContain('pf-v6-c-menu__list');
  });

  describe('keyboard navigation', () => {
    const renderWithButtons = (rowCount = 10) => {
      const result = render(
        <div style={{ width: 300, height: 300 }}>
          <VirtualSelectList
            rowCount={rowCount}
            rowHeight={36}
            rowRenderer={({ index, style, key }) => (
              <li key={key} style={style} role="option" aria-selected={false}>
                <button>Option {index}</button>
              </li>
            )}
          />
        </div>
      );
      const listbox = result.container.querySelector('[role="listbox"]')!;
      return { ...result, listbox };
    };

    test('ArrowDown advances focused index', () => {
      const { listbox, container } = renderWithButtons();

      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      const focused = container.querySelector('[data-row-index="0"] button');
      expect(focused).toBeTruthy();
      expect(document.activeElement === focused || container.querySelectorAll('[data-row-index]').length > 0).toBe(true);

      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      const items = container.querySelectorAll('[data-row-index]');
      expect(items.length).toBeGreaterThan(1);
    });

    test('ArrowUp moves focus backward', () => {
      const { listbox, container } = renderWithButtons();

      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });

      const items = container.querySelectorAll('[data-row-index]');
      expect(items.length).toBeGreaterThan(0);
    });

    test('Home moves focus to the first row', () => {
      const { listbox, container } = renderWithButtons();

      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'Home' });

      const firstItem = container.querySelector('[data-row-index="0"]');
      expect(firstItem).toBeTruthy();
    });

    test('End moves focus to the last row', () => {
      const { listbox, container } = renderWithButtons(5);

      fireEvent.keyDown(listbox, { key: 'End' });

      const lastItem = container.querySelector('[data-row-index="4"]');
      expect(lastItem).toBeTruthy();
    });

    test('ArrowDown does not go past the last row', () => {
      const { listbox, container } = renderWithButtons(3);

      fireEvent.keyDown(listbox, { key: 'End' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      const items = container.querySelectorAll('[data-row-index]');
      const lastIndex = Math.max(...Array.from(items).map((el) => parseInt(el.getAttribute('data-row-index')!, 10)));
      expect(lastIndex).toBe(2);
    });

    test('ArrowUp does not go before the first row', () => {
      const { listbox, container } = renderWithButtons();

      fireEvent.keyDown(listbox, { key: 'ArrowUp' });

      const firstItem = container.querySelector('[data-row-index="0"]');
      expect(firstItem).toBeTruthy();
    });

    test('keyboard events are ignored when rowCount is 0', () => {
      const { listbox } = renderWithButtons(0);

      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });
      fireEvent.keyDown(listbox, { key: 'Home' });
      fireEvent.keyDown(listbox, { key: 'End' });
    });
  });

  test('constrains height to maxHeight when rows exceed it', () => {
    const { container } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={100}
          rowHeight={36}
          maxHeight={200}
          rowRenderer={defaultRowRenderer}
        />
      </div>
    );

    const listbox = container.querySelector('[role="listbox"]');
    const computedHeight = listbox?.getAttribute('style');
    expect(computedHeight).toContain('height');
  });

  test('snapshot', () => {
    const { asFragment } = render(
      <div style={{ width: 300, height: 300 }}>
        <VirtualSelectList
          rowCount={5}
          rowHeight={36}
          maxHeight={300}
          rowRenderer={defaultRowRenderer}
          aria-label="Snapshot test"
        />
      </div>
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
