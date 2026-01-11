from blocks import Block

DEFAULT_JSX = """// The 'React' object is automatically available in this environment.
// Props are dynamically added as inputs to the node.
// 'on' props are added as outputs.
// 'onWorkflowOutputChange' is a special system prop.
export default function InteractiveForm({
  // This prop will become an input port named 'title'
  title = "Interactive Form",
  // This prop will become an output port named 'onTextEntered'
  onTextEntered,
  onWorkflowOutputChange
}) {
  // State for the text that changes when the first button is clicked
  const [displayText, setDisplayText] = React.useState('Hello World!');
  // State for the text input field
  const [inputValue, setInputValue] = React.useState('');

  const handleChangeTextClick = () => {
    setDisplayText('The text has changed!');
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handlePassOutputClick = () => {
    // 1. Pass the value from the input field
    //    to the 'onTextEntered' output port.
    if (onWorkflowOutputChange) {
      onWorkflowOutputChange('onTextEntered', inputValue);
    }

    // 2. (Optional) Trigger the rest of the workflow to execute.
    window.parent.postMessage({ type: 'TRIGGER_WORKFLOW_EXECUTION' }, '*');
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: '#f9f9f9', color: 'black', fontFamily: 'sans-serif' }}>
      
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{title}</h3>
      
      <p style={{ margin: '0 0 10px 0' }}>{displayText}</p>
      <button onClick={handleChangeTextClick} style={{ marginBottom: '10px', cursor: 'pointer', padding: '8px', width: '100%' }}>
        Change Display Text
      </button>

      <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="text-input">Text to Output:</label>
        <input
          id="text-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type here..."
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handlePassOutputClick} style={{ cursor: 'pointer', padding: '8px', backgroundColor: '#5865f2', color: 'white', border: 'none', borderRadius: '4px' }}>
          Pass to Output & Run Workflow
        </button>
      </div>

    </div>
  );
}
"""

DEFAULT_CSS = """/* 
  These styles apply to the component in the preview.
  You can use standard CSS selectors.
*/

/* Style the main container. The inline styles in the JSX will also apply. */
div {
  transition: box-shadow 0.3s ease-in-out;
}

div:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

/* Style all buttons within the component */
button {
  transition: background-color 0.2s ease, transform 0.1s ease;
}

button:hover {
  /* Slightly darken the button on hover */
  filter: brightness(90%);
}

button:active {
  /* Give a 'pressed' effect */
  transform: scale(0.98);
}

/* Style the text input field */
input[type="text"]:focus {
  border-color: #5865f2; /* Match the button color */
  box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
  outline: none;
}
"""

class ReactBlock(Block):
    """
    A block for creating interactive UI components with React.
    The code is edited and rendered on the frontend.
    """
    def __init__(self, name: str, jsx_code: str = DEFAULT_JSX, css_code: str = DEFAULT_CSS, x: float = 0.0, y: float = 0.0):
        super().__init__(name, block_type="REACT", x=x, y=y)
        self.jsx_code = jsx_code
        self.css_code = css_code
        
        # Register default ports that should always be present for demonstration.
        self.register_input("title", data_type="string", default_value="Interactive Form")
        self.register_output("onTextEntered", data_type="any")

    def execute(self):
        # The core logic is handled on the frontend.
        # The backend just acts as a data pass-through if needed.
        # For now, we do noting during server side execution.
        pass

    def update_ports(self, inputs_list, outputs_list):
        """
        Synchronizes the block's inputs and outputs with the lists provided by the frontend.
        Preserves existing values/connections where possible, and ensures default
        ports ('title', 'onTextEntered') are not removed.
        """
        DEFAULT_INPUTS = {"title"}
        DEFAULT_OUTPUTS = {"onTextEntered"}

        # --- Sync Inputs ---
        new_input_keys = set(item['key'] for item in inputs_list)
        current_input_keys = set(self.inputs.keys())

        # Keys to remove are ones that are currently present, but are not in the new list,
        # AND are not default ports.
        keys_to_remove = current_input_keys - new_input_keys - DEFAULT_INPUTS
        for key in keys_to_remove:
            del self.inputs[key]
            if key in self.input_meta: del self.input_meta[key]
            if key in self.input_connectors: del self.input_connectors[key]

        # Add/Update inputs
        for item in inputs_list:
            key = item['key']
            if key not in self.inputs:
                self.register_input(key, data_type=item.get('data_type', 'any'))

        # --- Sync Outputs ---
        new_output_keys = set(item['key'] for item in outputs_list)
        current_output_keys = set(self.outputs.keys())
        
        keys_to_remove_outputs = current_output_keys - new_output_keys - DEFAULT_OUTPUTS
        for key in keys_to_remove_outputs:
            del self.outputs[key]
            if key in self.output_meta: del self.output_meta[key]
            if key in self.output_connectors: del self.output_connectors[key]

        for item in outputs_list:
            key = item['key']
            if key not in self.outputs:
                self.register_output(key, data_type=item.get('data_type', 'any'))

    def to_dict(self):
        data = super().to_dict()
        data["jsx_code"] = self.jsx_code
        data["css_code"] = self.css_code
        return data
