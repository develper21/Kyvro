import React from 'react';
import { Minus, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface WindowFrameProps {
  title: string;
  children: React.ReactNode;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  onForward?: () => void;
}

const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  children,
  onMinimize,
  onMaximize,
  onClose,
  showBackButton = false,
  onBack,
  onForward
}) => {
  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="h-screen bg-[#1e1e2e] flex flex-col overflow-hidden">
      {/* Title Bar */}
      <div className="bg-[#2a2a3e] border-b border-white/10 flex items-center justify-between px-4 py-2 drag-region">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Navigation Buttons (if shown) */}
          {showBackButton && (
            <div className="flex items-center space-x-1 no-drag">
              <button
                onClick={onBack}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                disabled={!onBack}
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={onForward}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                disabled={!onForward}
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
          
          {/* App Icon and Title */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="text-white font-medium text-sm">{title}</span>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-1 no-drag">
          <button
            onClick={handleMinimize}
            className="p-1 rounded hover:bg-white/10 transition-colors group"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 rounded hover:bg-white/10 transition-colors group"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-red-500/20 transition-colors group"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default WindowFrame;
