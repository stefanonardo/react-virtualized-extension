---
id: Virtual select list
section: extensions
source: react
sourceLink: https://github.com/patternfly/react-virtualized-extension
propComponents: ['VirtualSelectList']
---

Note: React Virtualized Extension lives in its own package at [`@patternfly/react-virtualized-extension`](https://www.npmjs.com/package/@patternfly/react-virtualized-extension)!

import { VirtualSelectList } from '@patternfly/react-virtualized-extension';
import { Select, SelectOption, MenuToggle, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Button, Badge } from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { useState, useMemo, useRef } from 'react';

## About

VirtualSelectList is a virtualized replacement for PatternFly's SelectList component. It renders only the visible items in a scrollable dropdown, enabling Select menus with thousands of options without DOM performance degradation.

Use VirtualSelectList as a drop-in replacement for `<SelectList>` inside a composable `<Select>`. The `itemRenderer` callback receives positioning styles that must be applied to each rendered `<SelectOption>`.

## Examples

### Basic

```js file="./VirtualSelectListBasic.tsx"

```

### Typeahead with filtering

```js file="./VirtualSelectListTypeahead.tsx"

```

### Multi-select

```js file="./VirtualSelectListMulti.tsx"

```
