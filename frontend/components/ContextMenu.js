import React from 'react';
import { useStore } from '../lib/store';

const ContextMenu = () => {
  const { contextMenu, removeBlock, toggleMenu, closeContextMenu } = useStore();

  if (!contextMenu) {
    return null;
  }

  const { id, top, left } = contextMenu;

  const handleSettings = () => {
    toggleMenu(id);
    closeContextMenu();
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this block?')) {
      removeBlock(id);
    } else {
      closeContextMenu();
    }
  };

  return (
    <div className="context-menu" style={{ top, left }}>
      <div className="context-menu-item" onClick={handleSettings}>
        Settings
      </div>
      <div className="context-menu-item danger" onClick={handleRemove}>
        Remove Block
      </div>
    </div>
  );
};

export default ContextMenu;