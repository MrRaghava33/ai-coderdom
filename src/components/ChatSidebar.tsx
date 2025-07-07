import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

const ChatSidebar = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
}: ChatSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = (sessionId: string) => {
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  return (
    <div className="w-64 bg-chat-sidebar border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-chat-hover",
                currentSessionId === session.id ? "bg-chat-message-ai" : ""
              )}
              onClick={() => onSelectSession(session.id)}
            >
              {editingId === session.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveTitle(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle(session.id);
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="w-full bg-transparent border-none outline-none text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {session.title}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.messageCount} messages • {session.timestamp.toLocaleDateString()}
                  </div>
                </>
              )}

              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(session);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          AI Code Assistant v1.0
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;