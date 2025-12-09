import React, { useState, useEffect } from 'react';
import { ChefHat, Video, Clock, Sparkles, Utensils, AlertCircle, Save, Trash2, FileText, Plus, ChevronRight, PenTool } from 'lucide-react';
import { Button } from './components/Button';
import { ScriptOutput } from './components/ScriptOutput';
import { generateFoodScript } from './services/geminiService';
import { ScriptRequest, LoadingState, SavedScript } from './types';

function App() {
  // --- State: Generation ---
  const [request, setRequest] = useState<ScriptRequest>({
    topic: '',
    style: '治愈系 Vlog',
    duration: '1-3分钟',
    tone: '温馨/治愈',
    keyPoints: ''
  });
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  // --- State: Script Data ---
  // The current script content being displayed/edited
  const [currentScriptContent, setCurrentScriptContent] = useState<string>('');
  // If we are editing an existing saved script, this is its ID. If null, it's a new unsaved script.
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  
  // --- State: Persistence ---
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');

  // --- Constants ---
  const styles = ["治愈系 Vlog", "快节奏卡点", "ASMR 沉浸式", "硬核教程", "探店/测评", "趣味剧情", "带货/口播"];
  const tones = ["温馨/治愈", "幽默/搞笑", "专业/权威", "热情/高亢", "高端/精致", "接地气"];
  const durations = ["< 60秒 (短视频)", "1-3分钟 (中视频)", "> 3分钟 (长视频)"];

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem('foodvlog_saved_scripts');
    if (saved) {
      try {
        setSavedScripts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved scripts", e);
      }
    }
  }, []);

  const saveToLocalStorage = (scripts: SavedScript[]) => {
    localStorage.setItem('foodvlog_saved_scripts', JSON.stringify(scripts));
  };

  // --- Handlers: Generation ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.topic.trim()) return;

    setLoadingState(LoadingState.LOADING);
    setError(null);
    // Note: We don't clear currentScriptContent immediately to prevent flashing empty, 
    // but typically we want to show new content.
    // Let's reset ID since it's a new generation.
    setCurrentScriptId(null); 

    try {
      const result = await generateFoodScript(request);
      setCurrentScriptContent(result);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleInputChange = (field: keyof ScriptRequest, value: string) => {
    setRequest(prev => ({ ...prev, [field]: value }));
  };

  // --- Handlers: Saved Scripts ---
  const handleSaveScript = () => {
    if (!currentScriptContent.trim()) return;

    const timestamp = Date.now();
    let updatedScripts: SavedScript[];

    if (currentScriptId) {
      // Update existing
      updatedScripts = savedScripts.map(s => 
        s.id === currentScriptId 
          ? { ...s, content: currentScriptContent, updatedAt: timestamp, topic: request.topic } // Update topic in case it changed in form (though usually form matches)
          : s
      );
    } else {
      // Create new
      const newId = crypto.randomUUID();
      const newScript: SavedScript = {
        id: newId,
        topic: request.topic || "未命名脚本",
        content: currentScriptContent,
        createdAt: timestamp,
        updatedAt: timestamp,
        request: { ...request }
      };
      updatedScripts = [newScript, ...savedScripts];
      setCurrentScriptId(newId);
    }

    setSavedScripts(updatedScripts);
    saveToLocalStorage(updatedScripts);
    // Optional: visual feedback handled by 'isSaved' prop derivation
  };

  const handleDeleteScript = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("确定要删除这个脚本吗？")) {
      const updated = savedScripts.filter(s => s.id !== id);
      setSavedScripts(updated);
      saveToLocalStorage(updated);
      
      // If we deleted the currently active script, clear the view
      if (currentScriptId === id) {
        setCurrentScriptId(null);
        setCurrentScriptContent('');
        setLoadingState(LoadingState.IDLE);
      }
    }
  };

  const handleLoadScript = (script: SavedScript) => {
    setCurrentScriptContent(script.content);
    setCurrentScriptId(script.id);
    setRequest(script.request); // Restore the form inputs too
    setLoadingState(LoadingState.SUCCESS); // Show as if successfully generated
    
    // On mobile, we might want to switch to the output view automatically if we were in library
    // But for now, layout is side-by-side on desktop.
  };

  const handleNewScript = () => {
    setCurrentScriptId(null);
    setCurrentScriptContent('');
    setLoadingState(LoadingState.IDLE);
    setRequest({
      topic: '',
      style: '治愈系 Vlog',
      duration: '1-3分钟',
      tone: '温馨/治愈',
      keyPoints: ''
    });
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] text-gray-800 selection:bg-orange-200 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleNewScript}>
            <div className="bg-orange-500 p-2 rounded-lg text-white shadow-lg shadow-orange-500/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
              FoodVlog AI <span className="text-orange-500 font-normal ml-1 text-sm">脚本大师</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={handleNewScript}
               className="hidden sm:flex items-center text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
             >
               <Plus className="w-4 h-4 mr-1" /> 新建脚本
             </button>
             <a 
              href="#" 
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              v1.0
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md:py-8 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Column: Sidebar (Form or Library) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full bg-white rounded-2xl shadow-xl shadow-orange-900/5 border border-orange-100 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-orange-100">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-colors ${
                  activeTab === 'create' 
                    ? 'text-orange-600 bg-orange-50/50 border-b-2 border-orange-500' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <PenTool className="w-4 h-4 mr-2" />
                创作
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center transition-colors ${
                  activeTab === 'library' 
                    ? 'text-orange-600 bg-orange-50/50 border-b-2 border-orange-500' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                我的脚本 ({savedScripts.length})
              </button>
            </div>

            {/* Content Area for Left Sidebar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              
              {/* Tab: Create Form */}
              {activeTab === 'create' && (
                <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900">开始创作</h2>
                    <p className="text-xs text-gray-500 mt-1">AI 智能生成短视频分镜脚本</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                      <Utensils className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                      主题 / 菜品
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例如：夏日柠檬茶..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-gray-50 focus:bg-white text-sm"
                      value={request.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                      <Video className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                      风格
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {styles.map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => handleInputChange('style', style)}
                          className={`text-xs py-2 px-2 rounded-lg border transition-all truncate text-left ${
                            request.style === style
                              ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50/30'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                      时长
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-white text-sm"
                      value={request.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                    >
                      {durations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                      语气
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tones.map(tone => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => handleInputChange('tone', tone)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            request.tone === tone
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                      亮点 (选填)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="例如：简单易学、无糖低卡..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-gray-50 focus:bg-white resize-none text-sm"
                      value={request.keyPoints}
                      onChange={(e) => handleInputChange('keyPoints', e.target.value)}
                    />
                  </div>

                  <div className="pt-2 sticky bottom-0 bg-white pb-2">
                    <Button 
                      type="submit" 
                      className="w-full text-base shadow-xl shadow-orange-500/20 py-3.5" 
                      isLoading={loadingState === LoadingState.LOADING}
                    >
                      {loadingState === LoadingState.LOADING ? '正在构思...' : '✨ 生成脚本'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab: Saved Library */}
              {activeTab === 'library' && (
                <div className="space-y-3 pb-4">
                  {savedScripts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>还没有保存的脚本</p>
                      <button 
                        onClick={() => setActiveTab('create')}
                        className="text-orange-500 font-semibold text-sm mt-2 hover:underline"
                      >
                        去创作一个
                      </button>
                    </div>
                  ) : (
                    savedScripts.map((s) => (
                      <div 
                        key={s.id}
                        onClick={() => handleLoadScript(s)}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                          currentScriptId === s.id 
                            ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' 
                            : 'bg-white border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800 line-clamp-1 pr-6">{s.topic}</h3>
                          <button
                            onClick={(e) => handleDeleteScript(s.id, e)}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2 opacity-80">
                           {s.content.substring(0, 60).replace(/[#*`]/g, '')}...
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {new Date(s.updatedAt).toLocaleDateString()}
                          </span>
                          {currentScriptId === s.id && (
                             <span className="text-[10px] font-bold text-orange-600 flex items-center">
                               编辑中 <ChevronRight className="w-3 h-3 ml-0.5" />
                             </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8 xl:col-span-9 h-full overflow-hidden flex flex-col">
            {loadingState === LoadingState.IDLE && !currentScriptContent && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                  <ChefHat className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">准备好创作了吗？</h3>
                <p className="text-gray-500 max-w-md">
                  在左侧输入您的灵感，AI 将为您生成包含标题、分镜、台词的完整拍摄脚本。支持反复编辑和保存。
                </p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                   {["爆款标题", "精准分镜", "互动话术", "拍摄建议"].map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-orange-100 text-sm text-gray-600 shadow-sm">
                        ✨ {item}
                      </div>
                   ))}
                </div>
              </div>
            )}

            {loadingState === LoadingState.LOADING && (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-white/30 rounded-2xl border border-white/50">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Utensils className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 animate-pulse">大厨正在为您烹饪脚本...</h3>
                <p className="text-gray-500">正在分析爆款元素、设计分镜...</p>
              </div>
            )}

            {loadingState === LoadingState.ERROR && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start space-x-4 mt-10">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1">生成失败</h3>
                  <p className="text-red-600">{error || "发生未知错误，请稍后重试。"}</p>
                  <Button 
                    variant="secondary" 
                    className="mt-4 bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={handleSubmit}
                  >
                    重试
                  </Button>
                </div>
              </div>
            )}

            {(loadingState === LoadingState.SUCCESS || (loadingState === LoadingState.IDLE && currentScriptContent)) && (
              <div className="h-full">
                 <ScriptOutput 
                   content={currentScriptContent} 
                   onContentChange={setCurrentScriptContent}
                   onSave={handleSaveScript}
                   isSaved={!!currentScriptId}
                 />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
