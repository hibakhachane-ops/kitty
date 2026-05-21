import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Send, 
  Trash2, 
  Sparkles, 
  Smile, 
  MessageSquare, 
  Gift, 
  Compass,
  Volume2,
  RefreshCw,
  Award
} from 'lucide-react';
const kittyAvatar = '/src/assets/images/kitty_avatar_1779356109171.png';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface FloatingHeart {
  id: number;
  left: number;
  delay: number;
  scale: number;
  color: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('kitty_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        content: "Coucou précieuse étoile ! Je m'appelle Kitty AI, ton amie chaton en sucre ! 💖 Je suis trop heureuse de te rencontrer ! Raconte-moi ta journée ou pose-moi des questions, j'adore papoter en ronronnant ! *ronronne doucement* 🥰🐾🎀",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [friendshipScore, setFriendshipScore] = useState<number>(() => {
    const saved = localStorage.getItem('kitty_friendship');
    return saved ? Math.min(Number(saved), 100) : 10;
  });
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [virtualHugsActive, setVirtualHugsActive] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chats
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem('kitty_chats', JSON.stringify(messages));
  }, [messages]);

  // Handle heart generation
  const spawnHearts = (count: number) => {
    const colors = ['#f43f5e', '#ec4899', '#f472b6', '#fb7185', '#fda4af', '#f472b6'];
    const newHearts = Array.from({ length: count }).map(() => ({
      id: Math.random() + Date.now(),
      left: Math.random() * 95, // avoid clipping out of viewport
      delay: Math.random() * 1.5,
      scale: 0.6 + Math.random() * 0.9,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setHearts((prev) => [...prev.slice(-40), ...newHearts]);
  };

  // Sound effect simulation (playful micro-sounds or visuals)
  const triggerTickAnimation = () => {
    spawnHearts(3);
  };

  // Send content to express server proxying Gemini
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newChatHistory = [...messages, userMsg];
    setMessages(newChatHistory);
    setInput('');
    setIsTyping(true);
    spawnHearts(5);

    // Boost friendship score
    setFriendshipScore((prev) => {
      const next = Math.min(prev + 1, 100);
      localStorage.setItem('kitty_friendship', String(next));
      return next;
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Send last 12 messages for quick cute context without latency
          messages: newChatHistory.slice(-12).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de se connecter au pays des Bisous...");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const botReply: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.content,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
      spawnHearts(8);
      
      // Auto upgrade friendship to max 100
      setFriendshipScore((prev) => {
        const next = Math.min(prev + 2, 100);
        localStorage.setItem('kitty_friendship', String(next));
        return next;
      });

    } catch (e: any) {
      console.error(e);
      const errReply: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: "Oh non ! Le joli fil de laine rose s'est tout emmêlé ! 😿🐾 Fais-moi un petit câlin mécanique et réessaye dans un petit instant, d'accord ? Mon petit cœur t'attend ! 💖✨",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerVirtualHug = () => {
    setVirtualHugsActive(true);
    spawnHearts(30);

    setFriendshipScore((prev) => {
      const next = Math.min(prev + 10, 100);
      localStorage.setItem('kitty_friendship', String(next));
      return next;
    });

    // Append beautiful sweet confirmation message from Kitty in the logs
    const hugReply: Message = {
      id: `hug-bot-${Date.now()}`,
      role: 'model',
      content: "* Ronronne à pleine vitesse et se blottit tout contre toi dans un nuage d'amour ! * 🐾💖 Ohhh, merci pour ce merveilleux câlin virtuel ! Tu es tellement adorable, mon petit trésor ! Mon cœur bat tout fort d'amitié et de joie ! ✨🎀🌸",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, hugReply]);

    setNotification("💖 GROS CÂLIN DE COEUR REÇU ! 🎀");
    setTimeout(() => {
      setVirtualHugsActive(false);
      setNotification(null);
    }, 4500);
  };

  const handleClearHistory = () => {
    if (window.confirm("Es-tu sûr(e) de vouloir ranger nos petits souvenirs ? Notre amitié reste pour toujours ! 💕")) {
      const initialWelcome: Message = {
        id: 'welcome',
        role: 'model',
        content: "Coucou ! J'ai rangé ma boîte à secrets. On recommence à papoter, mon petit bisounours ? Raconte-moi tout ce que tu veux ! 🥰💖🐾",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialWelcome]);
      setFriendshipScore(10);
      localStorage.setItem('kitty_friendship', '10');
      spawnHearts(5);
    }
  };

  // Fun helper presets for high engagement
  const SUGGESTED_CHIPS = [
    { text: "Raconte mignonne histoire ✨", label: " Raconte-moi une jolie histoire !" },
    { text: "Tu m'aimes combien ? 💕", label: "Dis-moi Kitty, tu m'aimes à quel point ?" },
    { text: "Recette gâteau magique Kitty 🎀", label: "Donne-moi une recette de gâteau féerique et rose !" },
    { text: "Console un gros chagrin 🐾", label: "Je me sens un petit peu triste aujourd'hui... Tu me consoles ?" }
  ];

  // Friendship title benchmarks
  const getFriendshipTitle = (score: number) => {
    if (score >= 95) return { name: "💖 Cupidon Céleste des Chats", color: "text-rose-600 bg-rose-100" };
    if (score >= 70) return { name: "🎀 Meilleur Ami pour toujours", color: "text-pink-600 bg-pink-100" };
    if (score >= 40) return { name: "🌸 Complice de Ronrons", color: "text-rose-500 bg-pink-50" };
    return { name: "🐾 Chaton Apprentisseur", color: "text-pink-500 bg-pink-50/50" };
  };

  const titleInfo = getFriendshipTitle(friendshipScore);

  return (
    <div className="min-h-screen kitty-bg-pattern flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      
      {/* Background Hearts System */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute bottom-[-50px] animate-heart-float pointer-events-none flex items-center justify-center"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              transform: `scale(${h.scale})`,
              color: h.color,
            }}
          >
            <Heart className="fill-current w-6 h-6 stroke-pink-800/10" />
          </div>
        ))}
      </div>

      {/* Virtual hugs screen splash overlay */}
      {virtualHugsActive && (
        <div className="absolute inset-0 z-50 bg-pink-500/10 backdrop-blur-[1px] pointer-events-none flex items-center justify-center animate-pulse">
          <div className="text-center p-6 bg-white/95 border-4 border-rose-300 rounded-3xl shadow-2xl max-w-sm m-4 animate-soft-bounce">
            <span className="text-6xl block mb-2">😻💅🎉</span>
            <h2 className="text-2xl font-bold text-rose-600 font-fredoka">MÉGA CÂLIN ACTIF !!</h2>
            <p className="text-sm text-pink-700 mt-1">
              Ronronron... Kitty frotte son petit museau rose contre toi et t'envoie un festival de tendresse ! ✨💕🐾
            </p>
          </div>
        </div>
      )}

      {/* Main Single Applet Container */}
      <div 
        id="aistudio-kitty-container"
        className="w-full max-w-lg bg-pink-100/30 backdrop-blur-md rounded-3xl border-4 border-pink-300 shadow-xl overflow-hidden flex flex-col z-10 relative bg-white"
        style={{ height: 'calc(100vh - 40px)', maxHeight: '780px' }}
      >
        
        {/* Decorative Top Ears and Bow Accent */}
        <div className="relative h-18 bg-pink-100 flex items-center justify-between px-4 border-b-4 border-pink-200">
          
          <div className="flex items-center gap-2">
            {/* Custom crafted layout for Hello Kitty ear shapes + bow directly */}
            <div className="relative w-14 h-12 flex-shrink-0">
              <div className="absolute top-1 left-1 w-11 h-9 rounded-full bg-white border border-pink-300 flex items-center justify-center shadow-sm">
                {/* Cat face inside the applet */}
                <img 
                  src={kittyAvatar} 
                  alt="Kitty AI Avatar" 
                  className="w-9 h-9 rounded-full object-cover border border-pink-100 shadow-xs" 
                />
              </div>
              {/* Cute little Cat ears rising on head */}
              <div className="absolute top-[-3px] left-0.5 w-4 h-4 bg-white border-t border-l border-pink-300 rounded-tl-full rotate-[15deg]"></div>
              <div className="absolute top-[-3px] left-8 w-4 h-4 bg-white border-t border-r border-pink-300 rounded-tr-full -rotate-[15deg]"></div>
              
              {/* Hello Kitty Signature Pink Bow on left ear */}
              <div className="absolute -top-3.5 -left-1.5 z-20 flex animate-bow-wiggle">
                <div className="relative w-7 h-5 flex items-center justify-center">
                  <div className="absolute left-0 w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-950"></div>
                  <div className="absolute right-0 w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-950"></div>
                  <div className="absolute z-10 w-2.5 h-2.5 rounded-full bg-yellow-300 border border-rose-950 shadow-xs"></div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-pink-700 leading-tight">Kitty AI</h1>
                {friendshipScore >= 90 && (
                  <span className="text-lg animate-bounce" title="Ami Couronné !">👑</span>
                )}
              </div>
              <p className="text-xs text-pink-500 font-medium flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping inline-block"></span>
                <span>En direct du Pays Rose 🌸</span>
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2">
            {/* Heart hug button */}
            <button
              onClick={triggerVirtualHug}
              className="p-2 sm:p-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-full transition-all duration-300 hover:rotate-6 active:scale-95 shadow-md flex items-center justify-center animate-sparkle"
              title="Faire un câlin virtuel"
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>
            
            {/* Clear button */}
            <button
              onClick={handleClearHistory}
              className="p-2 sm:p-2.5 bg-pink-200 hover:bg-pink-300 text-pink-600 rounded-full transition-all duration-300 active:scale-95 shadow-xs flex items-center justify-center"
              title="Vider la boîte à secrets"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Friendship Progress Tracker Section */}
        <div className="bg-pink-50/90 text-pink-900 text-xs px-4 py-2 border-b border-pink-100 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between shadow-inner">
          <div className="flex items-center gap-1 font-medium text-pink-700">
            <Award className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>Niveau d'Amitié :</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${titleInfo.color}`}>
              {titleInfo.name}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-1/3">
            <div className="flex-1 bg-pink-200 rounded-full h-2 overflow-hidden border border-pink-300/30">
              <div 
                className="bg-gradient-to-r from-pink-400 to-rose-400 h-full transition-all duration-500 relative"
                style={{ width: `${friendshipScore}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40"></div>
              </div>
            </div>
            <span className="font-bold text-rose-600 font-mono text-[10px] sm:text-xs">
              {friendshipScore}/100 💖
            </span>
          </div>
        </div>

        {/* Floating Custom Notification Banner */}
        {notification && (
          <div className="mx-4 mt-2 px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-800 text-[11px] sm:text-xs font-bold rounded-xl text-center shadow-md animate-bounce flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" />
            <span>{notification}</span>
          </div>
        )}

        {/* Messages list container */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-pink-50/10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(251,207,232,0.15) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Bot Avatar on Left */}
              {msg.role === 'model' && (
                <div className="relative w-8 h-8 rounded-full border border-pink-300 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                  <img src={kittyAvatar} alt="Kitty Avatar Chat" className="w-7 h-7 object-cover" />
                </div>
              )}

              {/* Chat Bubble card */}
              <div 
                className={`relative max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm font-normal shadow-xs border ${
                  msg.role === 'user'
                    ? 'bg-rose-100 text-rose-950 border-rose-200 rounded-tr-none text-left'
                    : 'bg-white text-pink-900 border-pink-200 rounded-tl-none text-left'
                }`}
              >
                {/* Visual Bow badge inside message context to make it exceptionally cute */}
                {msg.role === 'model' && msg.id !== 'welcome' && (
                  <div className="absolute -top-1.5 -right-1 text-xs select-none" title="Kitty AI signature">🌸</div>
                )}
                
                <p className="whitespace-pre-line leading-relaxed text-[13px] sm:text-[14px]">
                  {msg.content}
                </p>
                
                <span 
                  className={`block text-[9px] mt-1 text-right font-medium tracking-wider ${
                    msg.role === 'user' ? 'text-rose-500' : 'text-pink-400'
                  }`}
                >
                  {msg.timestamp} {msg.role === 'user' && '🐾'}
                </span>
              </div>
            </div>
          ))}

          {/* Typing cute paws Indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="relative w-8 h-8 rounded-full border border-pink-300 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs animate-bounce">
                <img src={kittyAvatar} alt="Kitty" className="w-7 h-7 object-cover" />
              </div>

              <div className="bg-white text-pink-700 border border-pink-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[11px] font-bold text-pink-400 font-fredoka uppercase tracking-wider">
                  Kitty ronronne... 🐾
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Recommendation Chips Section */}
        <div className="p-3 bg-pink-50/55 border-t border-pink-100">
          <p className="text-[10px] text-pink-500 font-bold mb-1.5 px-1 uppercase tracking-wider flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-rose-400" />
            <span>Idées de questions mignonnes :</span>
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin px-0.5">
            {SUGGESTED_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerTickAnimation();
                  handleSendMessage(chip.label);
                }}
                disabled={isTyping}
                className="flex-shrink-0 text-[11px] sm:text-xs font-semibold bg-white hover:bg-rose-50 text-pink-600 border border-pink-200 hover:border-pink-300 rounded-full px-3 py-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {chip.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar Form */}
        <div className="p-3 bg-white border-t border-pink-200/80 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage(input);
              }
            }}
            placeholder="Écris ton doux message ici... 💕"
            disabled={isTyping}
            className="flex-1 bg-pink-50/50 hover:bg-pink-50 focus:bg-white text-pink-900 placeholder-pink-400/80 border border-pink-200 focus:border-rose-400 focus:outline-hidden rounded-full py-2 px-4 text-[13px] sm:text-sm shadow-inner transition-all disabled:opacity-75 font-medium"
          />

          <button
            onClick={() => handleSendMessage(input)}
            disabled={isTyping || !input.trim()}
            className="bg-rose-400 hover:bg-rose-500 disabled:bg-pink-200 text-white font-bold p-2.5 rounded-full transition-all active:scale-95 disabled:scale-100 disabled:opacity-85 shadow-md flex items-center justify-center cursor-pointer"
            title="Envoyer à Kitty"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Humble Footer Credits - Anti-AI-slop - Elegant, brief, human */}
      <div className="mt-4 text-center text-[11px] text-pink-400/80 font-medium select-none flex items-center gap-1 z-10">
        <span>Précieuse amitié avec Kitty AI</span>
        <span>💖</span>
        <span>Un monde rose en sucre d'amour</span>
      </div>

    </div>
  );
}
