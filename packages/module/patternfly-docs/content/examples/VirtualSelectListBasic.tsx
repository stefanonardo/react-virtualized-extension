import { useState, FunctionComponent } from 'react';
import { Select, SelectOption, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { VirtualSelectList } from '@patternfly/react-virtualized-extension';

export const VirtualSelectListBasicExample: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>();

  const items: string[] = [];
  for (let i = 0; i < 10000; i++) {
    items.push(`Option ${i}`);
  }

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setSelected(value as string);
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      style={{ width: '200px' } as React.CSSProperties}
    >
      {selected || 'Select an option'}
    </MenuToggle>
  );

  return (
    <Select
      isOpen={isOpen}
      selected={selected}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={toggle}
      isScrollable
    >
      <VirtualSelectList
        rowCount={items.length}
        rowHeight={36}
        maxHeight={300}
        aria-label="Basic virtualized select"
        rowRenderer={({ index, style, key }) => (
          <SelectOption key={key} style={style} value={items[index]} isSelected={selected === items[index]}>
            {items[index]}
          </SelectOption>
        )}
      />
    </Select>
  );
};
