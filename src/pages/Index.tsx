import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ChatSidebar from '@/components/ChatSidebar';
import { geminiApi } from '@/utils/geminiApi';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
}

const Index = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    // Create initial session
    createNewSession();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date(),
      messageCount: 0,
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title }
          : session
      )
    );
  };

  const addMessage = (sessionId: string, message: Message) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              messages: [...session.messages, message],
              messageCount: session.messageCount + 1,
              timestamp: new Date()
            }
          : session
      )
    );
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };

    addMessage(currentSessionId, userMessage);

    // Update session title with first message
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0) {
      updateSessionTitle(currentSessionId, content);
    }

    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      let fullResponse = '';
      
      for await (const chunk of geminiApi.generateStreamResponse(content)) {
        if (controller.signal.aborted) {
          break;
        }
        
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      if (!controller.signal.aborted && fullResponse) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fullResponse,
          isUser: false,
          timestamp: new Date()
        };

        addMessage(currentSessionId, aiMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle }
          : session
      )
    );
  };

  return (
    <div className="h-screen bg-gradient-background flex">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4 bg-chat-background">
          <h1 className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            AI Code Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Your intelligent coding companion powered by Google Gemini
          </p>
        </div>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !isStreaming && (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-4xl mb-4">🤖</div>
                  <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Welcome to AI Code Assistant
                  </h2>
                  <p className="text-muted-foreground">
                    Ask me to generate code, explain programming concepts, debug issues, 
                    or help with any development task. I'm here to assist you!
                  </p>
                  <div className="grid grid-cols-1 gap-2 mt-6 text-sm">
                    <div className="p-3 bg-chat-message-ai rounded-lg text-left">
                      💡 "Create a React component for a todo list"
                    </div>
                    <div className="p-3 bg-chat-message-ai rounded-lg text-left">
                      🔧 "Debug this JavaScript function..."
                    </div>
                    <div className="p-3 bg-chat-message-ai rounded-lg text-left">
                      📚 "Explain how async/await works"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isStreaming && streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  content: streamingContent,
                  isUser: false,
                  timestamp: new Date()
                }}
              />
            )}

            {isLoading && !streamingContent && (
              <div className="flex gap-4 p-6 bg-chat-message-ai/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-ai border border-border flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="text-muted-foreground">Thinking...</div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStopGeneration={handleStopGeneration}
        />
      </div>
    </div>
  );
};

export default Index;