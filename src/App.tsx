/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Camera, 
  Printer, 
  CreditCard, 
  Image as ImageIcon, 
  Scissors, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock,
  ChevronRight,
  Star,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Add window type for AI Studio API key selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const services = [
  {
    title: 'ถ่ายรูปด่วน',
    description: 'รูปติดบัตร วีซ่า สมัครงาน รอรับได้เลย พร้อมปรับแต่งให้ดูดีเป็นธรรมชาติ',
    icon: <Camera className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/photo/600/400'
  },
  {
    title: 'ถ่ายภาพอีเว้นท์',
    description: 'รับถ่ายภาพงานแต่ง งานบวช งานวันเกิด และงานสัมมนาต่างๆ โดยช่างภาพมืออาชีพ',
    icon: <PartyPopper className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/event/600/400'
  },
  {
    title: 'ป้ายไวนิล',
    description: 'รับออกแบบและผลิตป้ายไวนิลทุกขนาด สีสด ทนแดด ทนฝน งานด่วนงานไว',
    icon: <Printer className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/vinyl/600/400'
  },
  {
    title: 'นามบัตร',
    description: 'นามบัตรคุณภาพสูง มีให้เลือกหลายเนื้อกระดาษ ออกแบบให้โดดเด่นเป็นมืออาชีพ',
    icon: <CreditCard className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/card/600/400'
  },
  {
    title: 'สติกเกอร์ไดคัท',
    description: 'สติกเกอร์ฉลากสินค้า ไดคัทตามทรง กันน้ำ ติดแน่น ทนนาน',
    icon: <Scissors className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/sticker/600/400'
  },
  {
    title: 'อัดรูปพร้อมกรอบ',
    description: 'อัดรูปคุณภาพสูง สีไม่ซีดจาง พร้อมกรอบรูปหลากหลายสไตล์ให้เลือก',
    icon: <ImageIcon className="w-8 h-8" />,
    image: 'https://picsum.photos/seed/frame/600/400'
  }
];

const reviews = [
  { name: 'คุณสมชาย', comment: 'งานไวมากครับ ถ่ายรูปติดบัตรสวยเป็นธรรมชาติ แนะนำเลย', rating: 5 },
  { name: 'คุณวิภา', comment: 'สั่งทำป้ายไวนิลร้านอาหาร สีสวยสดใสมากค่ะ ราคาไม่แพง', rating: 5 },
  { name: 'คุณเอก', comment: 'นามบัตรออกแบบสวย ถูกใจมากครับ พนักงานบริการดีมาก', rating: 5 },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function App() {
  const [aiTab, setAiTab] = React.useState<'generate' | 'chat'>('generate');
  const [prompt, setPrompt] = React.useState('');
  const [imageSize, setImageSize] = React.useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [chatInput, setChatInput] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'model', text: string, sources?: any[] }[]>([]);
  const [isChatting, setIsChatting] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState(false);

  React.useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const generateImage = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A professional high-quality design for ${prompt}. Style: modern, clean, premium.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: imageSize
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setGeneratedImage(`data:image/png;base64,${base64EncodeString}`);
          break;
        }
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "คุณคือผู้ช่วยอัจฉริยะของร้าน Snap Lux ให้คำแนะนำเรื่องงานพิมพ์ การออกแบบ และการถ่ายภาพอย่างเป็นมืออาชีพและเป็นกันเอง ใช้ข้อมูลจาก Google Search เพื่อให้ข้อมูลที่ทันสมัยที่สุด",
        },
      });

      const text = response.text || "ขออภัย ฉันไม่สามารถประมวลผลคำขอได้ในขณะนี้";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text, 
        sources: chunks?.map(c => c.web).filter(Boolean) 
      }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatHistory(prev => [...prev, { role: 'model', text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] text-purple-50 font-sans selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0f0a1a]/80 backdrop-blur-xl border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Camera className="w-7 h-7" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">SNAP LUX</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-purple-200/70">
              <a href="#services" className="hover:text-purple-400 transition-colors">บริการของเรา</a>
              <a href="#about" className="hover:text-purple-400 transition-colors">เกี่ยวกับเรา</a>
              <a href="#contact" className="hover:text-purple-400 transition-colors">ติดต่อเรา</a>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 border border-purple-400/20"
              >
                จองคิวออนไลน์
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-40 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-8"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                Premium Printing & Photography
              </motion.div>
              <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] mb-8 text-white tracking-tighter">
                Snap Lux <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  The Art of
                </span> <br />
                Memories
              </h1>
              <p className="text-xl text-purple-200/60 mb-10 max-w-lg leading-relaxed font-medium">
                ยกระดับทุกความทรงจำด้วยบริการถ่ายภาพและงานพิมพ์ระดับพรีเมียม 
                สีสันสมจริง คมชัด ทนทาน ด้วยเทคโนโลยีที่ทันสมัยที่สุด
              </p>
              <div className="flex flex-wrap gap-5">
                <motion.button 
                  whileHover={{ scale: 1.05, x: 5 }}
                  className="bg-white text-[#0f0a1a] px-10 py-5 rounded-2xl font-bold hover:bg-purple-50 transition-all flex items-center gap-3 group shadow-2xl shadow-white/5"
                >
                  ดูบริการทั้งหมด
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="bg-purple-900/30 text-purple-100 border border-purple-700/50 px-10 py-5 rounded-2xl font-bold hover:bg-purple-800/40 transition-all backdrop-blur-sm"
                >
                  ติดต่อสอบถาม
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative z-10 aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-purple-500/20 group">
                <img 
                  src="https://picsum.photos/seed/dark-store/800/1000" 
                  alt="Snap Lux Premium Store" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1a] via-transparent to-transparent opacity-60"></div>
              </div>
              
              {/* Floating Cards */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-[#1a1429] p-8 rounded-3xl shadow-2xl border border-purple-500/30 max-w-[260px] z-20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white text-lg">Express Service</span>
                </div>
                <p className="text-sm text-purple-200/50 leading-relaxed font-medium">งานด่วนรอรับได้เลยใน 15 นาที คุณภาพไม่ลดละ</p>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -top-10 -right-10 bg-indigo-600 p-6 rounded-3xl shadow-2xl border border-indigo-400/30 z-20"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white text-white" />
                  <span className="font-bold text-white uppercase tracking-widest text-xs">Premium Quality</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Studio Section */}
      <section id="ai-studio" className="py-32 bg-[#120c24] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Snap Lux AI Studio
            </motion.div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 text-white tracking-tight">AI อัจฉริยะเพื่อคุณ</h2>
            <p className="text-purple-200/50 max-w-2xl mx-auto text-lg font-medium">
              ออกแบบไอเดียเบื้องต้นหรือปรึกษาเรื่องงานพิมพ์ได้ทันทีด้วยขุมพลัง Gemini AI
            </p>
          </div>

          <div className="bg-[#1a1429] rounded-[3rem] border border-purple-500/20 overflow-hidden shadow-2xl">
            <div className="flex border-b border-purple-500/10">
              <button 
                onClick={() => setAiTab('generate')}
                className={`flex-1 py-6 font-bold transition-all flex items-center justify-center gap-2 ${aiTab === 'generate' ? 'bg-purple-600 text-white' : 'text-purple-300/50 hover:text-purple-200 hover:bg-white/5'}`}
              >
                <ImageIcon className="w-5 h-5" />
                สร้างไอเดียดีไซน์ (AI Image)
              </button>
              <button 
                onClick={() => setAiTab('chat')}
                className={`flex-1 py-6 font-bold transition-all flex items-center justify-center gap-2 ${aiTab === 'chat' ? 'bg-purple-600 text-white' : 'text-purple-300/50 hover:text-purple-200 hover:bg-white/5'}`}
              >
                <MessageCircle className="w-5 h-5" />
                ผู้ช่วยส่วนตัว (AI Chat)
              </button>
            </div>

            <div className="p-8 lg:p-12">
              {aiTab === 'generate' ? (
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-purple-300 uppercase tracking-widest mb-4">ระบุไอเดียที่คุณต้องการ</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="เช่น โลโก้ร้านกาแฟสไตล์มินิมอล, ป้ายไวนิลงานวันเกิดเด็กชายธีมอวกาศ..."
                        className="w-full bg-[#0f0a1a] border border-purple-500/20 rounded-2xl p-6 text-white placeholder:text-purple-200/20 focus:outline-none focus:border-purple-500/50 transition-all min-h-[150px]"
                      />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-purple-300 uppercase tracking-widest mb-4">ความละเอียด</label>
                        <select 
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value as any)}
                          className="w-full bg-[#0f0a1a] border border-purple-500/20 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="1K">1K (Standard)</option>
                          <option value="2K">2K (High Res)</option>
                          <option value="4K">4K (Ultra HD)</option>
                        </select>
                      </div>
                      <div className="flex-1 pt-8">
                        {!hasApiKey ? (
                          <button 
                            onClick={handleOpenKeySelector}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                          >
                            ตั้งค่า API Key เพื่อเริ่มใช้งาน
                          </button>
                        ) : (
                          <button 
                            onClick={generateImage}
                            disabled={isGenerating || !prompt}
                            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isGenerating ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                กำลังสร้างไอเดีย...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                สร้างภาพตัวอย่าง
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-purple-200/30 leading-relaxed">
                      * ภาพที่สร้างขึ้นเป็นเพียงไอเดียเบื้องต้นจาก AI เพื่อช่วยในการตัดสินใจออกแบบจริงกับทางร้าน
                    </p>
                  </div>
                  <div className="bg-[#0f0a1a] rounded-3xl border border-purple-500/10 flex items-center justify-center relative overflow-hidden aspect-square lg:aspect-auto">
                    {generatedImage ? (
                      <img src={generatedImage} alt="AI Generated Idea" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-12">
                        <div className="w-20 h-20 bg-purple-500/5 rounded-full flex items-center justify-center text-purple-500/20 mx-auto mb-6">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                        <p className="text-purple-200/20 font-medium">ภาพไอเดียจะปรากฏที่นี่</p>
                      </div>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-[#0f0a1a]/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-purple-200 font-bold">AI กำลังรังสรรค์ไอเดียให้คุณ...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[600px]">
                  <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <MessageCircle className="w-16 h-16 mb-4" />
                        <p className="text-xl font-bold">สอบถามเรื่องงานพิมพ์หรือขอไอเดียได้เลย</p>
                        <p className="text-sm">เช่น "แนะนำกระดาษสำหรับทำนามบัตรหรูๆ" หรือ "ป้ายไวนิลขนาด 3 เมตร ราคาประมาณเท่าไหร่"</p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[#0f0a1a] border border-purple-500/20 text-purple-100 rounded-tl-none shadow-xl'}`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-purple-500/10">
                              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">แหล่งข้อมูล:</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((s: any, j: number) => (
                                  <a key={j} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-colors">
                                    {s.title || 'Link'}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-[#0f0a1a] border border-purple-500/20 p-5 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="พิมพ์ข้อความสอบถาม..."
                      className="flex-1 bg-[#0f0a1a] border border-purple-500/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                    <button 
                      onClick={sendChatMessage}
                      disabled={isChatting || !chatInput}
                      className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                    >
                      ส่ง
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-32 bg-[#0a0612] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-24"
          >
            <motion.h2 variants={itemVariants} className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight">
              Our Professional Services
            </motion.h2>
            <motion.p variants={itemVariants} className="text-purple-200/50 max-w-2xl mx-auto text-lg font-medium">
              เราคัดสรรบริการที่ดีที่สุดเพื่อตอบสนองทุกความต้องการในงานภาพและงานพิมพ์ของคุณ
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ y: -15, scale: 1.02 }}
                className="group bg-[#161025] rounded-[2.5rem] p-10 border border-purple-900/20 transition-all hover:bg-[#1c1430] hover:border-purple-500/30 hover:shadow-3xl hover:shadow-purple-500/10"
              >
                <div className="w-20 h-20 bg-[#0f0a1a] rounded-[1.5rem] flex items-center justify-center text-purple-400 mb-8 border border-purple-800/30 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-400/30 transition-all duration-500 shadow-inner">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-300 transition-colors">{service.title}</h3>
                <p className="text-purple-200/40 mb-8 leading-relaxed font-medium group-hover:text-purple-200/60 transition-colors">
                  {service.description}
                </p>
                <div className="aspect-[16/10] rounded-3xl overflow-hidden grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 border border-purple-900/30">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-gradient-to-b from-[#0a0612] to-[#0f0a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { label: 'ปีที่ให้บริการ', value: '10+' },
              { label: 'ลูกค้าที่ไว้วางใจ', value: '50k+' },
              { label: 'รับประกันคุณภาพ', value: '100%' },
              { label: 'งานด่วนสั่งได้', value: '24h' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl lg:text-6xl font-black mb-3 text-white tracking-tighter">{stat.value}</div>
                <div className="text-purple-400/50 text-xs font-bold uppercase tracking-[0.3em]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-32 bg-[#0f0a1a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight">What Clients Say</h2>
              <p className="text-purple-200/40 text-lg font-medium">ความประทับใจจากลูกค้าที่ใช้บริการจริง</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 bg-purple-900/20 px-8 py-4 rounded-3xl border border-purple-700/30"
            >
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-6 h-6 fill-purple-500 text-purple-500" />
                ))}
              </div>
              <span className="font-black text-2xl text-white">4.9/5</span>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {reviews.map((review, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-[#161025] p-10 rounded-[2.5rem] border border-purple-900/30 shadow-xl relative group"
              >
                <div className="absolute -top-5 -left-5 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-serif">“</div>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-purple-400 text-purple-400" />
                  ))}
                </div>
                <p className="text-purple-100/70 italic mb-8 text-lg leading-relaxed font-medium">"{review.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-900/50 rounded-full border border-purple-700/30"></div>
                  <div className="font-bold text-white text-lg">— {review.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-[#0a0612]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1a1429] to-[#0f0a1a] rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.1)] flex flex-col lg:flex-row border border-purple-500/10"
          >
            <div className="p-16 lg:p-24 flex-1">
              <h2 className="text-5xl font-black text-white mb-12 tracking-tighter">Get In Touch</h2>
              <div className="space-y-10">
                <div className="flex items-start gap-8 group">
                  <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">ที่ตั้งร้าน</h4>
                    <p className="text-purple-200/40 text-lg leading-relaxed">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110</p>
                  </div>
                </div>
                <div className="flex items-start gap-8 group">
                  <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                    <Phone className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">เบอร์โทรศัพท์</h4>
                    <p className="text-purple-200/40 text-lg">02-XXX-XXXX, 08X-XXX-XXXX</p>
                  </div>
                </div>
                <div className="flex items-start gap-8 group">
                  <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Line ID</h4>
                    <p className="text-purple-200/40 text-lg">@snaplux (มี @ ข้างหน้า)</p>
                  </div>
                </div>
              </div>
              <div className="mt-16 flex flex-wrap gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 text-white px-12 py-6 rounded-[2rem] font-bold hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/20 border border-purple-400/30"
                >
                  แชทผ่าน Line
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/5 text-white border border-white/10 px-12 py-6 rounded-[2rem] font-bold hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  ดูแผนที่ Google Maps
                </motion.button>
              </div>
            </div>
            
            <div className="lg:w-2/5 bg-purple-600 p-16 lg:p-24 flex flex-col justify-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <h3 className="text-3xl font-black mb-10 tracking-tight">Opening Hours</h3>
              <div className="space-y-6">
                <div className="flex justify-between border-b border-purple-400/30 pb-4">
                  <span className="text-purple-100 font-medium">จันทร์ - ศุกร์</span>
                  <span className="font-black text-xl">09:00 - 20:00</span>
                </div>
                <div className="flex justify-between border-b border-purple-400/30 pb-4">
                  <span className="text-purple-100 font-medium">เสาร์</span>
                  <span className="font-black text-xl">10:00 - 18:00</span>
                </div>
                <div className="flex justify-between text-purple-200/60">
                  <span className="font-medium">อาทิตย์</span>
                  <span className="font-black text-xl italic">CLOSED</span>
                </div>
              </div>
              <div className="mt-16 p-8 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md">
                <p className="text-sm leading-relaxed font-medium text-purple-50">
                  * สำหรับงานถ่ายภาพอีเว้นท์และงานป้ายขนาดใหญ่ กรุณาจองคิวล่วงหน้าอย่างน้อย 3-7 วัน เพื่อการจัดเตรียมทีมงานที่ดีที่สุด
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-purple-900/30 bg-[#0a0612]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">SNAP LUX</span>
            </div>
            <p className="text-purple-200/30 text-sm font-medium">
              © {new Date().getFullYear()} Snap Lux. Crafted with Passion & Precision.
            </p>
            <div className="flex gap-8 text-purple-200/40 font-bold text-sm uppercase tracking-widest">
              <a href="#" className="hover:text-purple-400 transition-colors">FB</a>
              <a href="#" className="hover:text-purple-400 transition-colors">IG</a>
              <a href="#" className="hover:text-purple-400 transition-colors">TK</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
