# NodeLink - Visual Design System
*Design Philosophy Document*

## Overview
This document outlines the visual design system for NodeLink, a no-code API workflow builder. The design is inspired by modern development tools with a focus on clarity, professionalism, and intuitive node-based interaction.

---

## Design Philosophy

### Core Principles
1. **Dark-First Interface** - Reduces eye strain for extended workflow building sessions
2. **Information Density** - Maximize workspace while maintaining breathing room
3. **Visual Hierarchy** - Clear distinction between navigation, workspace, and configuration
4. **Professional Aesthetic** - Tool feels powerful and enterprise-ready
5. **Spatial Clarity** - Visual elements guide user attention naturally

---

## Color System

### Base Palette
```
Background Layers:
├── App Background:     #0A0A0A (deepest black)
├── Panel Background:   #1A1A1A (secondary panels)
├── Component BG:       #2A2A2A (cards, modals)
└── Input Fields:       #1E1E1E (form elements)

Borders & Dividers:
├── Subtle Border:      #2A2A2A
├── Standard Border:    #3A3A3A
└── Hover Border:       #4A4A4A

Text Hierarchy:
├── Primary Text:       #FFFFFF (headings, labels)
├── Secondary Text:     #A0A0A0 (descriptions)
└── Tertiary Text:      #6A6A6A (metadata, timestamps)
```

### Accent Colors
```
Primary Actions:
└── Blue:              #3B82F6 (buttons, links, selections)

Component Categories:
├── Compute (Orange):   #F97316
├── Storage (Cyan):     #06B6D4
├── Network (Purple):   #8B5CF6
├── Data (Green):       #10B981
└── Messaging (Pink):   #EC4899

Status Colors:
├── Success:           #22C55E
├── Warning:           #EAB308
├── Error:             #EF4444
└── Info:              #3B82F6
```

### Node Color System
Each node type has a signature color applied to its icon and connection handles:
- **Web Server / API Gateway**: Blue (#3B82F6)
- **Database**: Green (#10B981)
- **Cache / Storage**: Cyan (#06B6D4)
- **Lambda / Workers**: Orange (#F97316)
- **Load Balancer**: Purple (#8B5CF6)

---

## Typography

### Font Stack
```css
Primary Font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace Font: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace
```

### Type Scale
```
Hero Text (Dashboard Welcome):
├── Size: 36px
├── Weight: 300 (Light)
└── Color: #FFFFFF

Section Headings:
├── Size: 20px
├── Weight: 500 (Medium)
└── Color: #FFFFFF

Component Labels:
├── Size: 14px
├── Weight: 500
└── Color: #FFFFFF

Body Text:
├── Size: 14px
├── Weight: 400
└── Color: #A0A0A0

Small Text (Metadata):
├── Size: 12px
├── Weight: 400
└── Color: #6A6A6A

Tiny Text (Badges):
├── Size: 11px
├── Weight: 500
└── Color: #6A6A6A
```

---

## Layout Structure

### Three-Panel System

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar (60px height)                                   │
├─────────┬───────────────────────────────┬───────────────┤
│         │                               │               │
│  Left   │      Main Canvas              │     Right     │
│  Panel  │      (Infinite pan/zoom)      │     Panel     │
│ (280px) │                               │    (360px)    │
│         │                               │   (Collapsible)│
│         │                               │               │
└─────────┴───────────────────────────────┴───────────────┘
```

### Top Bar Components
```
┌──────────────────────────────────────────────────────────┐
│ [🏠] [Save] [Load] [Export JSON] [Export PNG]   [Clear] │
└──────────────────────────────────────────────────────────┘
```

### Left Panel (Component Library)
```
┌─────────────────────┐
│ COMPONENTS      [<] │ ← Collapse toggle
├─────────────────────┤
│ ▼ Compute & Servers │
│   • Web Server      │
│   • Compute Node    │
│   • Worker          │
│   • Serverless      │
├─────────────────────┤
│ ▼ Data & Storage    │
│   • Database        │
│   • Cache           │
│   • Storage         │
│   • Data Warehouse  │
└─────────────────────┘
```

### Right Panel (Node Properties)
```
┌──────────────────────┐
│ Node Properties  [>] │ ← Collapse toggle
├──────────────────────┤
│ Node Name *          │
│ [Web Server (Test)]  │
├──────────────────────┤
│ Node Type            │
│ [Web Server      ▼]  │
├──────────────────────┤
│ Description          │
│ [                 ]  │
├──────────────────────┤
│ Custom Attributes    │
│ + Add                │
│ No custom attributes │
├──────────────────────┤
│  [ Delete Node ]     │
└──────────────────────┘
```

---

## Components

### 1. Node Design

#### Default Node State
```
┌─────────────────────────────────┐
│  ◉  Node Name                   │ ← Connection handle (left)
│                                 │
│  [icon] Title Text          ◉   │ ← Connection handle (right)
│                                 │
│  Descriptive text...            │
└─────────────────────────────────┘

Visual Properties:
├── Background: #2A2A2A
├── Border: 1px solid #3A3A3A
├── Border Radius: 12px
├── Padding: 16px
├── Min Width: 200px
└── Box Shadow: 0 2px 8px rgba(0,0,0,0.3)
```

#### Selected Node State
```
Border: 2px solid #3B82F6
Box Shadow: 0 0 0 3px rgba(59,130,246,0.2)
```

#### Node Icon Style
- Size: 24x24px
- Background: Color-coded circle (based on category)
- Icon color: White
- Positioned: Left side of node title

#### Connection Handles
```
Shape: Circle
Size: 12px diameter
Position: 
├── Input: Left edge, vertically centered
└── Output: Right edge, vertically centered
Colors:
├── Default: #4A4A4A
├── Hover: #3B82F6
└── Connected: #3B82F6
```

### 2. Canvas Grid
```
Background: #0A0A0A
Dot Grid:
├── Color: #1A1A1A
├── Spacing: 20px
└── Size: 1px dots
```

### 3. Connection Lines
```
Default State:
├── Color: #4A4A4A
├── Width: 2px
├── Style: Dashed (4px dash, 4px gap)
└── Curve: Bezier curve

Hover State:
├── Color: #6A6A6A
└── Width: 3px

Active/Selected:
├── Color: #3B82F6
└── Style: Solid
```

### 4. Buttons

#### Primary Button
```
Background: #3B82F6
Text Color: #FFFFFF
Border Radius: 6px
Padding: 8px 16px
Font Size: 14px
Font Weight: 500

Hover:
└── Background: #2563EB

Active:
└── Background: #1D4ED8
```

#### Secondary Button
```
Background: transparent
Border: 1px solid #3A3A3A
Text Color: #FFFFFF
Border Radius: 6px
Padding: 8px 16px

Hover:
└── Background: #2A2A2A
```

#### Danger Button
```
Background: transparent
Border: 1px solid #7F1D1D
Text Color: #EF4444
Border Radius: 6px
Padding: 8px 16px

Hover:
└── Background: rgba(239,68,68,0.1)
```

### 5. Input Fields
```
Background: #1E1E1E
Border: 1px solid #3A3A3A
Border Radius: 6px
Padding: 8px 12px
Font Size: 14px
Text Color: #FFFFFF

Focus:
├── Border: 1px solid #3B82F6
└── Box Shadow: 0 0 0 3px rgba(59,130,246,0.1)

Placeholder:
└── Color: #6A6A6A
```

### 6. Dropdown Selects
```
Same as input fields, plus:
├── Dropdown Icon: Chevron down (right aligned)
└── Dropdown Menu:
    ├── Background: #2A2A2A
    ├── Border: 1px solid #3A3A3A
    ├── Border Radius: 6px
    ├── Box Shadow: 0 4px 16px rgba(0,0,0,0.4)
    └── Item Hover: #333333
```

### 7. Modal Dialog
```
Backdrop: rgba(0,0,0,0.7)

Modal Container:
├── Background: #1A1A1A
├── Border: 1px solid #2A2A2A
├── Border Radius: 12px
├── Box Shadow: 0 8px 32px rgba(0,0,0,0.5)
├── Max Width: 600px
└── Padding: 24px

Header:
├── Font Size: 20px
├── Font Weight: 500
├── Margin Bottom: 16px
└── Close Button: [X] (top right)
```

### 8. Component Library Item
```
┌─────────────────────┐
│ [icon] Web Server   │
└─────────────────────┘

Default State:
├── Background: transparent
├── Border: 1px solid transparent
├── Border Radius: 6px
├── Padding: 8px 12px
└── Cursor: grab

Hover State:
├── Background: #2A2A2A
└── Border: 1px solid #3A3A3A

Dragging State:
├── Opacity: 0.6
└── Cursor: grabbing
```

### 9. Project Card (Dashboard)
```
┌─────────────────────────────────┐
│  [Diagram Preview Thumbnail]    │
│                                 │
├─────────────────────────────────┤
│  AWS RAG Implementation      •••│
│  • 6 nodes  • 6 edges           │
│  35 minutes ago                 │
│                                 │
│  [ Open Project → ]             │
└─────────────────────────────────┘

Card Style:
├── Background: #1A1A1A
├── Border: 1px solid #2A2A2A
├── Border Radius: 12px
├── Padding: 0 (image full-bleed at top)
├── Hover: Border color changes to #3A3A3A
└── Box Shadow: 0 2px 8px rgba(0,0,0,0.2)

Thumbnail:
├── Height: 180px
├── Background: Gradient from #1A1A1A to #0A0A0A
└── Border Radius: 12px 12px 0 0

Metadata:
├── Padding: 16px
├── Font Size: 12px
└── Color: #6A6A6A
```

---

## Interactive States

### Hover Effects
```
Components should have subtle hover feedback:
├── Background lightens by ~5%
├── Border brightens by ~10%
├── Transition: all 0.15s ease
└── Cursor changes appropriately
```

### Active/Focus States
```
Active elements should show clear feedback:
├── Outline: 2px solid #3B82F6
├── Outline Offset: 2px
└── Box Shadow: Focus ring
```

### Loading States
```
Use skeleton loaders or spinners:
├── Spinner Color: #3B82F6
├── Background: #1A1A1A
└── Animation: Smooth rotation
```

### Error States
```
Input Fields:
├── Border: 1px solid #EF4444
└── Error Text: #EF4444, 12px, below input

Nodes:
└── Border: 2px solid #EF4444
```

---

## Spacing System

### Base Unit: 4px
```
Spacing Scale:
├── xs:  4px   (0.25rem)
├── sm:  8px   (0.5rem)
├── md:  16px  (1rem)
├── lg:  24px  (1.5rem)
├── xl:  32px  (2rem)
└── 2xl: 48px  (3rem)
```

### Application
```
Component Padding: md (16px)
Panel Padding: lg (24px)
Section Gaps: lg (24px)
Button Padding: sm md (8px 16px)
Form Field Gaps: md (16px)
```

---

## Animation & Transitions

### Micro-interactions
```css
/* Standard transition for most elements */
transition: all 0.15s ease;

/* Modal entrance */
transition: opacity 0.2s ease, transform 0.2s ease;
animation: slideIn 0.2s ease;

/* Node drag */
transition: none; /* Disable during drag */

/* Connection line drawing */
animation: drawLine 0.3s ease;

/* Hover effects */
transition: background-color 0.15s ease,
            border-color 0.15s ease,
            transform 0.15s ease;

/* Focus ring */
transition: outline 0.1s ease,
            box-shadow 0.1s ease;
```

### Canvas Interactions
```
Pan: Smooth momentum scrolling
Zoom: Smooth scale with center-point focus
Node Drop: Subtle bounce animation (0.2s)
```

---

## Accessibility

### Focus Indicators
```
All interactive elements must have visible focus states:
├── Outline: 2px solid #3B82F6
├── Outline Offset: 2px
└── Never use outline: none without replacement
```

### Color Contrast
```
All text must meet WCAG AA standards:
├── Primary text on dark: 16:1 ratio
├── Secondary text: 7:1 ratio
└── UI elements: 3:1 ratio minimum
```

### Keyboard Navigation
```
Tab Order: Logical left-to-right, top-to-bottom
Shortcuts:
├── Cmd/Ctrl + S: Save
├── Cmd/Ctrl + Z: Undo
├── Delete/Backspace: Delete selected
├── Escape: Close modal/deselect
└── Space: Pan canvas (hold)
```

---

## Responsive Considerations

### Breakpoints
```
Desktop (Primary):  1280px+
Tablet:             768px - 1279px
Mobile:             < 768px
```

### Panel Behavior
```
Desktop:
└── Three-panel layout with collapsible sides

Tablet:
├── Left panel collapses to icon-only
└── Right panel overlays on selection

Mobile:
├── Bottom sheet for component library
├── Modal overlay for properties
└── Full-screen canvas
```

---

## Component Library Organization

### Category Icons & Colors
```
📊 Compute & Servers (Orange #F97316)
├── Icon: Server stack
└── Components: Web Server, Compute, Worker, Serverless

💾 Data & Storage (Cyan #06B6D4)
├── Icon: Database cylinder
└── Components: Database, Cache, Storage, Warehouse

🔗 Networking (Purple #8B5CF6)
├── Icon: Network nodes
└── Components: Load Balancer, API Gateway, CDN, DNS

💬 Messaging & Queues (Pink #EC4899)
├── Icon: Message bubble
└── Components: Queue, Pub/Sub, Event Stream
```

---

## Visual Polish Details

### Shadows
```
Card Shadow:         0 2px 8px rgba(0,0,0,0.3)
Modal Shadow:        0 8px 32px rgba(0,0,0,0.5)
Dropdown Shadow:     0 4px 16px rgba(0,0,0,0.4)
Node Shadow:         0 2px 8px rgba(0,0,0,0.3)
Node Hover Shadow:   0 4px 16px rgba(0,0,0,0.4)
```

### Border Radius
```
Small (Badges):      4px
Medium (Buttons):    6px
Large (Cards):       12px
XLarge (Modals):     12px
Nodes:               12px
```

### Iconography
```
Style: Outlined, consistent stroke weight
Size Options: 16px, 20px, 24px
Primary Size: 20px for UI, 24px for nodes
Color: Inherits from parent or category color
```

---

## Template/Starter Screens

### Dashboard Welcome Screen
```
┌────────────────────────────────────────────────┐
│ Welcome Justin Chow,                           │
│ Create and manage your architecture diagrams   │
│                                                │
│ [🔍 Search projects...]                        │
│                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │[Preview] │ │[Preview] │ │[Preview] │       │
│ │Project 1 │ │Project 2 │ │Project 3 │       │
│ └──────────┘ └──────────┘ └──────────┘       │
└────────────────────────────────────────────────┘
```

### New Project Modal
```
┌────────────────────────────────────┐
│ Create New Project              [X]│
├────────────────────────────────────┤
│                                    │
│ Start with:                        │
│ • Start from Scratch (selected)    │
│ • Use Template                     │
│                                    │
│ Project Name                       │
│ [My Project________________]       │
│                                    │
│           [Cancel] [Create Project]│
└────────────────────────────────────┘
```

### Template Selection
```
┌────────────────────────────────────┐
│ Select a Template               [X]│
├────────────────────────────────────┤
│ [All] [Web Apps] [Microservices]  │
│      [Serverless] [Data Pipeline]  │
│                                    │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ Basic Web   │ │ Three-Tier  │   │
│ │ Application │ │ Web App     │   │
│ │ simple      │ │ medium      │   │
│ └─────────────┘ └─────────────┘   │
└────────────────────────────────────┘
```

---

## Implementation Notes

### CSS Framework
Recommend Tailwind CSS for rapid, consistent styling:
- Matches design tokens closely
- Excellent dark mode support
- Minimal bundle size with purging

### React Flow Customization
```javascript
// Canvas background
background={{
  color: '#1A1A1A',
  gap: 20,
  size: 1,
}}

// Connection line styles
connectionLineStyle={{
  stroke: '#4A4A4A',
  strokeWidth: 2,
  strokeDasharray: '4 4',
}}

// Node styles via custom components
// Apply className with Tailwind classes
```

### State Management Visual Feedback
```
Unsaved Changes: 
└── Dot indicator next to "Save" button

Executing Workflow:
└── Pulsing glow on active node

Success:
└── Green checkmark overlay on node

Error:
└── Red X overlay with shake animation
```

---

## Design System Checklist

- [ ] All colors use design token variables
- [ ] Typography follows type scale
- [ ] Spacing uses 4px base unit
- [ ] All interactive elements have hover states
- [ ] All focusable elements have focus indicators
- [ ] Animations use consistent timing functions
- [ ] Icons are consistent size and style
- [ ] Shadows follow depth hierarchy
- [ ] Border radius is consistent by component type
- [ ] Color contrast meets WCAG AA standards
- [ ] Components are responsive
- [ ] Dark mode is the primary interface
- [ ] Visual feedback for all state changes

---

## Next Steps for Implementation

1. **Set up design tokens** in CSS variables or Tailwind config
2. **Create base components** (Button, Input, Select, Modal)
3. **Build canvas** with React Flow and apply dark theme
4. **Design node components** with proper styling and states
5. **Implement panels** with collapsible functionality
6. **Add micro-interactions** and polish
7. **Test accessibility** with keyboard navigation and screen readers
8. **Optimize performance** for large workflows (50+ nodes)

---

*This design system ensures NodeLink has a professional, cohesive, and delightful user experience that matches the quality of modern development tools.*