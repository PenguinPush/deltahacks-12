# Blender-Style Nodes Update

The workflow editor now uses **Blender-style nodes** with all parameters visible and editable directly on the canvas!

---

## What Changed

### Before:
- ❌ Small nodes showing only title
- ❌ Double-click to open configuration modal
- ❌ Parameters hidden until modal opened
- ❌ Top/bottom connection handles

### After:
- ✅ **All parameters visible inline on the node**
- ✅ **Edit fields directly on the canvas** (no modal needed)
- ✅ **Collapsible nodes** (click header to collapse/expand)
- ✅ **Left/right connection handles** (Blender-style)
- ✅ **Organized sections:** Inputs → Credentials → Parameters
- ✅ **Visual hierarchy** with section headers

---

## Node Features

### 1. **Inline Parameter Editing**

All fields are now editable directly on the node:

**Input Fields:**
- Text inputs for strings
- Number inputs for numbers
- Checkboxes for booleans
- Placeholders showing examples

**Credentials:**
- Password fields with lock icon
- Visually separated from other fields
- Required fields marked with red asterisk (*)

**Parameters:**
- Dropdowns for select fields
- Text/number inputs
- Checkboxes for boolean toggles
- Disabled fields shown with reduced opacity

### 2. **Collapsible Nodes**

Click the node header to collapse/expand:
- **Expanded:** Shows all parameters (default)
- **Collapsed:** Shows only the title (save space)
- Chevron icon indicates collapse state

### 3. **Connection Handles**

Changed from vertical to horizontal flow:
- **Input handle:** Left side (like Blender)
- **Output handle:** Right side (like Blender)
- Smaller handles (2px instead of 3px)
- Hover effect on handles

### 4. **Visual Organization**

Three distinct sections with headers:

```
┌─────────────────────────────────┐
│  [Icon]  Stripe Payment    [v]  │ ← Header (collapsible)
├─────────────────────────────────┤
│ INPUTS                          │ ← Section 1
│  Amount *                       │
│  [2500         ]                │
│  Currency *                     │
│  [usd          ]                │
├─────────────────────────────────┤
│ CREDENTIALS                     │ ← Section 2
│  API Key *                      │
│  [sk_live_••••••] 🔒            │
├─────────────────────────────────┤
│ PARAMETERS                      │ ← Section 3
│  API Version                    │
│  [v1 ▼]                         │
│  □ Test Mode                    │
└─────────────────────────────────┘
```

### 5. **Smart Field Types**

The node automatically renders the correct input type:

| Field Type | Rendered As |
|------------|-------------|
| `string` | Text input |
| `number` | Number input |
| `boolean` | Checkbox with label |
| `select` | Dropdown menu |
| `password` | Password input with 🔒 icon |

### 6. **Status Indicators**

Shown at the bottom of expanded nodes:
- ⚡ **Execution time:** `45ms`
- ⚠️ **Errors:** Red box with error message

---

## Node Styling

### Size
- **Min width:** 280px
- **Max width:** 350px
- Taller than before (shows all content)

### Colors
- **Background:** Dark gray (rgba(38, 38, 38, 0.95))
- **Border:** Subtle white border
- **Header:** Tinted with node color (20% opacity)
- **Sections:** Separated by thin borders

### Typography
- **Header:** 12px font, white
- **Section titles:** 10px, gray, uppercase
- **Field labels:** 11px, light gray
- **Inputs:** 11px, white text on dark background

### Status Colors
- **Idle:** Default
- **Running:** Blue pulsing border
- **Success:** Green border
- **Error:** Red border with shake animation

---

## How to Use

### Adding a Node
1. Drag node from left panel to canvas
2. Node appears **expanded** by default
3. All parameters are immediately visible

### Editing Parameters
1. Click directly into any input field
2. Type to edit text/number fields
3. Click checkboxes to toggle boolean values
4. Select from dropdowns for select fields
5. Changes save automatically to node data

### Collapsing Nodes
1. Click the node header (title bar)
2. Node collapses to show only title
3. Click again to expand
4. Use this to save canvas space

### Connecting Nodes
1. Drag from right handle (output) of one node
2. Drop on left handle (input) of another node
3. Field mapper modal opens to configure data flow

### Advanced Configuration (Optional)
- Double-click node to open full configuration modal
- Modal still available for power users
- Most edits can be done inline now

---

## Technical Details

### Data Storage

All inline edits are stored in the node's data:

```typescript
interface NodeData {
  label: string;
  type: string;
  description: string;
  color: string;
  templateId: string;

  // NEW: Inline parameter storage
  credentials?: Record<string, string>;
  parameters?: Record<string, string | number | boolean>;
  inputValues?: Record<string, string | number | boolean>;

  // Status
  status?: 'idle' | 'running' | 'success' | 'error';
  executionTime?: number;
  error?: string;
}
```

### Real-time Updates

When you edit a field:
1. `onChange` event fires
2. `updateNodeData()` function called
3. React Flow `setNodes()` updates node data
4. Node re-renders with new value
5. Changes immediately visible on canvas

### Performance

- **Lazy rendering:** Only renders visible sections
- **Collapsed nodes:** Minimal DOM elements
- **Optimized re-renders:** Only affected node updates
- **No modals:** Faster interaction, less context switching

---

## Comparison with Blender

### Similar to Blender:
✅ All parameters inline on node
✅ Collapsible nodes
✅ Left/right connection flow
✅ Organized sections
✅ Compact design
✅ No popup windows for basic edits

### Different from Blender:
- Blender uses sockets with types (we use generic handles)
- Blender has node groups (we don't yet)
- Blender shows data preview (we show status instead)

---

## Benefits

### 1. **Faster Workflow**
- No double-clicking to open modals
- Edit multiple nodes quickly
- See all parameters at a glance

### 2. **Better Overview**
- Understand node configuration without clicking
- Compare parameters across nodes easily
- Spot missing required fields visually (red asterisks)

### 3. **Space Efficient**
- Collapse nodes you're not editing
- Wider nodes (left-right flow) fit more on screen
- No modal overlays blocking canvas

### 4. **Intuitive**
- Familiar to Blender users
- Direct manipulation (WYSIWYG)
- Clear visual hierarchy

---

## Example Workflows

### Stripe Payment Node

**Expanded:**
```
┌────────────────────────────────────┐
│ 💳 Stripe Payment              [v] │
├────────────────────────────────────┤
│ INPUTS                             │
│  Amount *        [2500]            │
│  Currency *      [usd]             │
│  Customer Email  [user@email.com]  │
├────────────────────────────────────┤
│ CREDENTIALS                        │
│  API Key *       [sk_live_••••] 🔒 │
├────────────────────────────────────┤
│ PARAMETERS                         │
│  API Version     [v2 ▼]            │
│  □ Test Mode                       │
└────────────────────────────────────┘
```

**Collapsed:**
```
┌────────────────────────────────────┐
│ 💳 Stripe Payment              [>] │
└────────────────────────────────────┘
```

### Vultr Create Instance Node

```
┌────────────────────────────────────┐
│ 🖥️  Vultr Create Instance     [v] │
├────────────────────────────────────┤
│ INPUTS                             │
│  Region *        [ewr]             │
│  Plan *          [vc2-1c-1gb]      │
│  OS ID *         [387]             │
│  Label           [my-server]       │
├────────────────────────────────────┤
│ CREDENTIALS                        │
│  API Key *       [vultr_••••••] 🔒 │
├────────────────────────────────────┤
│ PARAMETERS                         │
│  API Version     [v2 ▼]            │
│  ☑ Enable IPv6                     │
└────────────────────────────────────┘
```

---

## Troubleshooting

### Fields not appearing?
- Check if template has fields defined
- Some nodes may have 0 inputs/parameters (like Workflow Input)

### Can't type in input?
- Make sure you're clicking inside the input box
- Check if field is disabled (grayed out)
- Try clicking again to focus

### Node too wide?
- Maximum width is 350px
- Long field names/values will wrap
- Consider shorter labels in template definitions

### Collapse not working?
- Click the header bar (title area)
- Don't click input fields in header
- Chevron icon should rotate when collapsing

---

## Future Enhancements

Possible additions to make nodes even better:

1. **Resizable nodes** - Drag to resize width
2. **Custom node colors** - User-defined color per instance
3. **Field validation** - Show validation errors inline
4. **Field descriptions** - Tooltip on hover
5. **Autocomplete** - Suggest values for {{variable}} syntax
6. **Copy/paste values** - Between similar nodes
7. **Node presets** - Save common configurations
8. **Socket types** - Color-coded by data type
9. **Data preview** - Show output values on node
10. **Node groups** - Combine nodes into reusable groups

---

## Developer Notes

### Adding a New Field Type

To add a new field type to templates:

1. **Update APITemplate interface:**
```typescript
type: 'text' | 'select' | 'number' | 'boolean' | 'color' | 'file'
```

2. **Add rendering logic in APINode:**
```typescript
{param.type === 'color' ? (
  <input
    type="color"
    value={data.parameters?.[param.id] || param.default}
    onChange={(e) => updateNodeData(param.id, e.target.value, 'parameter')}
    className="w-full h-8 rounded border border-gray-700 nodrag"
  />
) : ...}
```

3. **Update NodeData type if needed:**
```typescript
parameters?: Record<string, string | number | boolean | File>;
```

### Styling Custom Fields

All inputs use these Tailwind classes:
```css
w-full px-2 py-1 text-[11px]
bg-gray-800 border border-gray-700 rounded
text-gray-200 placeholder-gray-500
focus:outline-none focus:border-accent-blue
nodrag
```

**Important:** `nodrag` class prevents drag-and-drop when clicking inputs!

---

## Summary

Your workflow editor now has **Blender-style inline nodes** with:

✅ All parameters visible on canvas
✅ Direct inline editing (no modals)
✅ Collapsible nodes (click header)
✅ Left/right connection flow
✅ Organized sections (Inputs/Credentials/Parameters)
✅ Smart field rendering (text/number/select/checkbox/password)
✅ Visual status indicators
✅ Compact and efficient design

This makes NodeLink faster, more intuitive, and visually cleaner - just like Blender's node editor! 🎨
