import { useState, useMemo, useRef, FunctionComponent } from 'react';
import {
  Select,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button
} from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { VirtualSelectList, VirtualSelectListRef } from '@patternfly/react-virtualized-extension';

const allItems: string[] = [];
for (let i = 0; i < 10000; i++) {
  allItems.push(`Option ${i}`);
}

export const VirtualSelectListTypeaheadExample: FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [filterValue, setFilterValue] = useState('');
  const listRef = useRef<VirtualSelectListRef>(null);

  const filteredItems = useMemo(
    () =>
      filterValue
        ? allItems.filter((item) => item.toLowerCase().includes(filterValue.toLowerCase()))
        : allItems,
    [filterValue]
  );

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setSelected(value as string);
    setFilterValue('');
    setIsOpen(false);
  };

  const onInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setFilterValue(value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={filterValue || selected || ''}
          onClick={() => setIsOpen(true)}
          onChange={onInputChange}
          autoComplete="off"
          placeholder="Search from 10,000 options..."
        />
        {(filterValue || selected) && (
          <TextInputGroupUtilities>
            <Button
              variant="plain"
              onClick={() => {
                setSelected(undefined);
                setFilterValue('');
              }}
              aria-label="Clear input"
            >
              <TimesIcon />
            </Button>
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      isOpen={isOpen}
      selected={selected}
      onSelect={onSelect}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setFilterValue('');
        }
      }}
      toggle={toggle}
      isScrollable
    >
      <VirtualSelectList
        ref={listRef}
        rowCount={filteredItems.length}
        rowHeight={36}
        maxHeight={300}
        aria-label="Typeahead virtualized select"
        noRowsRenderer={() => (
          <li className="pf-v6-c-menu__list-item pf-m-disabled" role="option" aria-disabled="true">
            No results found for &quot;{filterValue}&quot;
          </li>
        )}
        rowRenderer={({ index, style, key }) => (
          <SelectOption key={key} style={style} value={filteredItems[index]} isSelected={selected === filteredItems[index]}>
            {filteredItems[index]}
          </SelectOption>
        )}
      />
    </Select>
  );
};
