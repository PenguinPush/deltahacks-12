# Node Connection Interface

## Connection Mechanics

### Visual Connection System

**Connection Ports (Handles)**
- Each node displays connection ports as small circular elements
- **Output ports** appear on the right side of nodes (data flows out)
- **Input ports** appear on the left side of nodes (data flows in)
- Ports are color-coded by data type:
  - Blue: Object/JSON data
  - Green: String data
  - Orange: Number data
  - Purple: Array data
  - Gray: Any type (accepts all)

### Creating Connections

**Drag-to-Connect Flow**
1. User hovers over an output port → port highlights and enlarges slightly
2. User clicks and drags from the output port → a connection line follows the cursor
3. As the line approaches compatible input ports, they glow to indicate compatibility
4. Incompatible ports remain dim or show a red indicator
5. User releases over a valid input port → connection snaps into place with a subtle animation
6. Invalid drop attempts show a brief error tooltip: "Incompatible data types" or "Connection already exists"

**Connection Line Behavior**
- Active connection lines use **dashed lines** while being dragged (shown in screenshots)
- Completed connections become **solid lines**
- Lines curve smoothly using Bézier curves for visual clarity
- Line thickness indicates data flow strength (thicker for array/object data)
- Hover over any connection line highlights both connected nodes and shows data type label

### Connection States

**Visual Feedback States**
1. **Idle**: Subtle gray lines connecting nodes
2. **Hover**: Line highlights in white/bright color, increases thickness
3. **Selected**: Line turns accent color (cyan/blue), shows edit controls
4. **Active (during execution)**: Animated "flow" effect moving along the line, showing data passing through
5. **Error**: Red line with warning icon, hover shows error message

### Connection Validation

**Real-Time Compatibility Checking**
- As user drags a connection, the system evaluates compatibility on-the-fly
- Compatible ports show:
  - Green glow effect
  - Tooltip: "Connect: user_email → recipient_email"
  - Enlarged drop zone
- Incompatible ports show:
  - Subtle red glow or remain dimmed
  - Tooltip: "Type mismatch: string → number"
  - No drop zone enlargement

**Validation Rules**
- One-to-many connections allowed: One output can feed multiple inputs
- Many-to-one requires user to choose merge strategy (use first, use last, concatenate)
- Circular dependencies prevented: System detects and blocks connections that create loops
- Type mismatches flagged but not always blocked (allows for auto-conversion)

### Connection Management

**Editing Connections**
- Click any connection line to select it
- Selected connection shows:
  - Highlighted path
  - Small "X" button at midpoint to delete
  - Data type badge showing what's being passed
  - Transform icon (if transformation is applied)

**Connection Context Menu** (Right-click on connection line)
- View data preview (last execution result)
- Add transformation (open field mapper)
- Duplicate to another input
- Delete connection
- View connection history/logs

**Bulk Operations**
- Select multiple connections by Shift+Click
- Delete all selected with Delete key
- Alt+Drag from node copies all its connections to new node

### Multi-Node Connection Patterns

**Sequential Flow** (shown in second screenshot)
```
[S3 Source Bucket] → [Lambda (Ingestion)] → [Bedrock (Embeddings)]
                  ↘                        ↘
                    [API Gateway] → [Lambda (Query)] → [Bedrock (LLM)]
                                                      ↗
                                    [OpenSearch Serverless]
```

**Connection Types**
1. **Direct data flow**: Simple output → input mapping (solid line)
2. **Conditional flow**: Connection only triggers if condition met (dashed line with condition badge)
3. **Parallel branching**: One output splits to multiple inputs (single line that branches)
4. **Merge points**: Multiple outputs converge to one input (multiple lines converge with merge strategy badge)

### Smart Connection Features

**Auto-Routing**
- Connection lines automatically route around nodes to avoid overlap
- Lines choose optimal path (fewest intersections)
- Manual control points can be added by Alt+Click on line

**Connection Suggestions**
- When adding a new node, system suggests likely connections based on:
  - Data type compatibility
  - Common workflow patterns
  - Previously connected nodes in user's history
- Suggested connections appear as ghosted lines with "Connect?" tooltip

**Quick Connect Mode** (keyboard shortcut: C)
- User selects a node and presses C
- All compatible nodes highlight with connection previews
- Click any highlighted node to instantly create connection
- ESC to cancel

### Port Configuration

**Dynamic Ports**
- Some nodes have variable number of ports (e.g., "Add Input" button for Lambda functions with multiple parameters)
- Ports can be labeled (hover shows: "customer_email", "payment_amount")
- Optional ports appear with dashed border until connected

**Port Badges**
- Small icons on ports indicate:
  - 🔒 Required field (must be connected)
  - ⚡ Real-time data (webhook/stream)
  - 🔄 Async operation (may take time)
  - 📝 Requires transformation (type mismatch but convertible)

### Connection Errors & Recovery

**Visual Error Indicators**
- Broken connections (e.g., deleted node) shown as red lines with "!" icon
- Hover shows: "Source node removed" or "Target field no longer exists"
- Quick action: "Find replacement" or "Delete connection"

**Auto-Healing**
- If a node's output schema changes, system attempts to remap connections
- Users notified: "3 connections updated automatically, 1 needs review"
- Review panel shows before/after mapping

### Accessibility

**Keyboard Navigation**
- Tab through nodes and connections
- Arrow keys to select adjacent connections
- Enter to edit selected connection
- Delete to remove selected connection

**Screen Reader Support**
- Connections announced as: "Output from Stripe Payment, field customer_email, connected to SendGrid Email, field recipient"
- Connection state announced: "Valid", "Requires attention", "Error"

### Performance Optimization

**Large Workflow Handling**
- Connections outside viewport not rendered (virtual scrolling)
- Level-of-detail rendering: distant connections shown as simple lines
- Connection clustering: many parallel connections shown as single thick line with count badge
- Zoom level affects detail: zoomed out = simplified view, zoomed in = full detail

### Mobile/Touch Considerations

**Touch Interactions**
- Long-press on port to start connection drag
- Two-finger pan to move canvas while dragging connection
- Tap on connection line to select (larger hit area than desktop)
- Pinch-to-zoom doesn't interfere with connection dragging