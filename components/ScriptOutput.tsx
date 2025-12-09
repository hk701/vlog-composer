import React, { useEffect, useRef } from 'react';
import { Copy, Check, Save, Edit2, Eye, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ScriptOutputProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onSave: () => void;
  isSaved: boolean; // To show visual feedback or disable save if no changes (optional, here just for context if needed)
}

export const ScriptOutput: React.FC<ScriptOutputProps> = ({ 
  content, 
  onContentChange,
  onSave,
  isSaved
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Simple Markdown-like rendering helper
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-gray-800 mt-8 mb-4">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold text-orange-700 mt-6 mb-3 border-b-2 border-orange-100 pb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold text-gray-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      
      // Table rows (simple detection)
      if (line.includes('|')) {
        return <div key={index} className="font-mono text-sm bg-gray-50 p-1 overflow-x-auto whitespace-pre border-b border-gray-100 last:border-0">{line}</div>;
      }

      // Bold lists
      if (line.trim().startsWith('- **')) {
          const parts = line.split('**');
          if (parts.length >= 3) {
             return <li key={index} className="ml-4 my-1 text-gray-700"><span className="font-bold text-gray-900">{parts[1]}</span>{parts[2]}</li>
          }
      }
      
      // Standard lists
      if (line.trim().startsWith('- ')) return <li key={index} className="ml-4 my-1 text-gray-700">{line.replace('- ', '')}</li>;
      if (line.trim().startsWith('* ')) return <li key={index} className="ml-4 my-1 text-gray-700">{line.replace('* ', '')}</li>;

      // Empty lines
      if (line.trim() === '') return <br key={index} />;

      // Default paragraph
      return <p key={index} className="text-gray-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-orange-100 flex flex-col h-full max-h-[800px]">
      {/* Header Toolbar */}
      <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-orange-800 flex items-center">
            <span className="mr-2 text-xl">📝</span> 脚本内容
          </h2>
          {isSaved && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">已保存</span>}
        </div>
        
        <div className="flex items-center gap-2">
           <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 hover:text-orange-700 border border-gray-200 hover:border-orange-300 transition-colors"
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4 mr-1.5" /> 预览
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-1.5" /> 编辑
              </>
            )}
          </button>

          <button 
            onClick={onSave}
            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 border border-transparent shadow-sm transition-colors"
          >
            <Save className="w-4 h-4 mr-1.5" />
            保存
          </button>

          <button 
            onClick={handleCopy}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-white text-gray-600 hover:bg-orange-100 hover:text-orange-700 border border-gray-200 hover:border-orange-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full min-h-[500px] p-6 md:p-8 outline-none text-gray-800 font-mono text-sm leading-relaxed resize-none"
            placeholder="在这里编辑你的脚本..."
          />
        ) : (
          <div className="p-6 md:p-8 prose prose-orange max-w-none">
            {renderContent(content)}
          </div>
        )}
      </div>
    </div>
  );
};
