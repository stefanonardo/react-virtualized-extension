import { useState, FunctionComponent } from 'react';
import {
  Select,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
  Badge
} from '@patternfly/react-core';
import { VirtualSelectList } from '@patternfly/react-virtualized-extension';

export const VirtualSelectListMultiExample: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const items: string[] = [];
  for (let i = 0; i < 1000; i++) {
    items.push(`Option ${i}`);
  }

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const val = value as string;
    setSelectedItems((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      style={{ width: '300px' } as React.CSSProperties}
    >
      {selectedItems.length > 0 ? (
        <>
          {selectedItems.length} selected
          <Badge isRead className="pf-v6-u-ml-sm">
            {selectedItems.length}
          </Badge>
        </>
      ) : (
        'Select options'
      )}
    </MenuToggle>
  );

  return (
    <Select
      isOpen={isOpen}
      selected={selectedItems}
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={toggle}
      isScrollable
    >
      <VirtualSelectList
        rowCount={items.length}
        rowHeight={36}
        maxHeight={300}
        isAriaMultiselectable
        aria-label="Multi-select virtualized list"
        rowRenderer={({ index, style, key }) => (
          <SelectOption
            key={key}
            style={style}
            value={items[index]}
            hasCheckbox
            isSelected={selectedItems.includes(items[index])}
          >
            {items[index]}
          </SelectOption>
        )}
      />
    </Select>
  );
};
