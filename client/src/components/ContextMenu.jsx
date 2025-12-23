import React from 'react';

function ContextMenu({ x, y, options, onClose, onMouseEnter, onMouseLeave }) {
    const isNearBottom = y > window.innerHeight - 220; 
    const isNearRight = x > window.innerWidth - 180;

    const style = {
        position: 'fixed',
        zIndex: 50,
        top: isNearBottom ? 'auto' : y,
        bottom: isNearBottom ? (window.innerHeight - y) : 'auto',
        
        left: isNearRight ? 'auto' : x,
        right: isNearRight ? (window.innerWidth - x) : 'auto',
    };

    return (
        <div
            className="bg-[#2c2f30] border border-zinc-700 rounded-lg shadow-lg p-2 min-w-[150px]"
            style={style}
            onClick={(e) => e.stopPropagation()} 
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <ul className="flex flex-col gap-1">
                {options.map((option, index) => (
                    <li
                        key={index}
                        onClick={() => {
                            option.action();
                            onClose();
                        }}
                        className={`px-3 py-2 text-sm rounded cursor-pointer flex items-center gap-3 ${
                            option.danger 
                                ? "text-red-400 hover:bg-zinc-700" 
                                : "text-white hover:bg-zinc-700"
                        }`}
                    >
                        {option.icon}
                        <span>{option.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ContextMenu;