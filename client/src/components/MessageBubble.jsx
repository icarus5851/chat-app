import React from "react";
import { MdDeleteForever } from 'react-icons/md';

function MessageBubble({ message, isSender, onDelete }) {
    const alignment = isSender ? 'justify-end' : 'justify-start';
    const bgColor = isSender ? 'bg-violet-600' : 'bg-zinc-700';

    return (
        <div className={`flex items-end gap-2 group ${alignment}`}>
            {isSender && (
                <button
                    onClick={() => onDelete(message._id)}
                    className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <MdDeleteForever size={18} />
                </button>
            )}

            <div className={`flex gap-2 items-end max-w-lg py-1.5 px-3 rounded-lg ${bgColor}`}>
                {message.messageType === 'image' ? (
                    <img src={message.content} alt="Sent media" className="max-w-xs rounded-md object-cover" />
                ) : (
                    <p className="text-white break-words whitespace-pre-wrap min-w-0">{message.content}</p>
                )}
                <p className="text-xs text-zinc-300 self-end mt-1 flex-shrink-0">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

export default MessageBubble;