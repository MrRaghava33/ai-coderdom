import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, codeId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeId = `${message.id}-${Math.random()}`;
    
    return match ? (
      <div className="relative group">
        <div className="flex items-center justify-between bg-chat-message-ai border border-border rounded-t-lg px-4 py-2">
          <span className="text-sm text-muted-foreground font-mono">{language}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedCode === codeId ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="!mt-0 !rounded-t-none"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="bg-chat-message-ai px-2 py-1 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className={cn(
      "flex gap-4 p-6 transition-colors",
      message.isUser ? "bg-chat-background" : "bg-chat-message-ai/20"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        message.isUser 
          ? "bg-gradient-primary text-primary-foreground" 
          : "bg-gradient-ai border border-border"
      )}>
        {message.isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
              pre: ({ children }) => <div>{children}</div>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;