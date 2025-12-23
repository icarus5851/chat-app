import React, { useMemo, useRef } from "react";
import {MdImage } from 'react-icons/md'; 
import { RiCheckDoubleLine, RiCheckLine } from 'react-icons/ri';

function MessageBubble({ message, isSender, onDelete, scrollToBottom, onContextMenu, onMouseEnter, onMouseLeave, onReplyClick, isGroup }) {

    const alignmentClass = isSender ? 'ml-auto' : 'mr-auto';
    const colorClass = isSender ? 'bg-[#8675e1] text-white' : 'bg-zinc-700 text-white';
    const roundedClass = isSender ? 'rounded-l-2xl rounded-tr-2xl rounded-br-none' : 'rounded-r-2xl rounded-tl-2xl rounded-bl-none';

    const formattedTime = useMemo(() => {
        return new Date(message.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }, [message.createdAt]);

    const longPressTimer = useRef(null);

    const handleTouchStart = (e) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            onContextMenu(touch.pageX, touch.pageY, message._id);
        }, 500); 
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleRightClick = (event) => {
        event.preventDefault();
        onContextMenu(event.pageX, event.pageY, message._id);
    };

    const renderReply = () => {
        if (!message.replyTo) return null;
        const replyContent = message.replyTo.content || "Message deleted";
        const replyType = message.replyTo.messageType || "text";
        const replySender = message.replyTo.sender?.name || "Unknown";

        return (
            <div 
                onClick={(e) => { e.stopPropagation(); onReplyClick(message.replyTo._id); }}
                className={`mb-1 p-1.5 rounded-md cursor-pointer flex flex-col border-l-4 text-xs ${isSender ? 'bg-black/10 border-white/50' : 'bg-black/20 border-violet-400'}`}
            >
                <span className="font-bold text-white/90 mb-0.5">{replySender}</span>
                <span className="text-white/70 truncate max-w-[200px] flex items-center gap-1">
                    {replyType === 'image' && <MdImage size={14} />}
                    {replyType === 'image' ? 'Photo' : replyContent}
                </span>
            </div>
        );
    };

    return (
        <div 
            id={`msg-${message._id}`} 
            className={`flex w-full mt-1.5 space-x-3 max-w-[85%] sm:max-w-md ${alignmentClass} ${isSender ? 'justify-end' : 'justify-start'} select-none`} 
            onContextMenu={handleRightClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            onMouseEnter={onMouseEnter} 
            onMouseLeave={onMouseLeave} 
        >   
            <div className={`relative px-3 py-2 shadow-md min-w-[80px] ${colorClass} ${roundedClass}`}>
                
                {/* name inside message in group*/}
                {isGroup && !isSender && (
                    <div className="text-[11px] font-bold text-[#a78bfa] mb-1 leading-none">
                        {message.sender.name}
                    </div>
                )}

                {renderReply()} 

                {message.messageType === 'image' ? (
                    <div className="relative -mx-1 -mt-1 mb-1">
                        <img 
                            src={message.content} 
                            alt="Sent media" 
                            className="rounded-lg w-full object-cover max-h-[350px]" 
                            onLoad={scrollToBottom}
                        />
                        <div className="absolute bottom-1 right-1 bg-black/40 px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                            <span className="text-[10px] text-white/90">{formattedTime}</span>
                            {isSender && (
                                <span className="text-white text-[14px]">
                                    {message.status === 'read' ? <RiCheckDoubleLine /> : <RiCheckLine />}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="leading-snug text-[15px]">
                        <span className="whitespace-pre-wrap break-words">{message.content}</span>
                        <span className="float-right ml-3 mt-2 flex items-center gap-1 opacity-70 select-none h-3 self-end">
                            <span className="text-[10px] relative top-[1px]">{formattedTime}</span>
                            {isSender && (
                                <span className="text-[16px]">
                                    {message.status === 'read' ? <RiCheckDoubleLine/> : <RiCheckLine />}
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageBubble;