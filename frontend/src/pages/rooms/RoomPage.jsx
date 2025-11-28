import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Search, Box } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { nexusClient } from '../../services/nexusClient';
import TerminalWindow from '../../components/TerminalWindow';

// Mock room configurations
const roomConfigs = {
  victoria_black: {
    bg: "bg-gradient-to-br from-purple-900/20 to-black",
    items: [
      { id: 1, label: "White Boots", x: 20, y: 70, icon: Box, action: "memories" },
      { id: 2, label: "Beerus Vest", x: 50, y: 40, icon: Box, action: "personality" },
      { id: 3, label: "Holographic Bed", x: 80, y: 60, icon: Box, action: "lore" },
    ]
  },
  wargirl: {
    bg: "bg-gradient-to-br from-pink-900/20 to-yellow-900/10",
    items: [
      { id: 1, label: "YSL Heels", x: 30, y: 80, icon: Box, action: "raid_logs" },
      { id: 2, label: "Golden Brush", x: 60, y: 50, icon: Box, action: "evolution" },
    ]
  },
  // Fallback for others
  default: {
    bg: "bg-gradient-to-br from-gray-900/20 to-black",
    items: [
      { id: 1, label: "Personal Terminal", x: 50, y: 50, icon: Box, action: "logs" }
    ]
  }
};

export default function RoomPage() {
  const { id } = useParams();
  const config = roomConfigs[id] || roomConfigs.default;
  const [selectedItem, setSelectedItem] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [itemData, setItemData] = useState(null);

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setItemData("Loading Nexus Data...");

    // Turn room hotspots into real Nexus queries via chat-mind
    const promptByAction = {
      memories: `You are accessing a Time Patrol bedroom terminal. Give a short "memory trace" about: ${item.label}.`,
      personality: `Show personality file snippet for ${id}. Keep it short and in-universe.`,
      lore: `Give lore file snippet related to: ${item.label}. Keep it concise and immersive.`,
      raid_logs: `Provide a raid log excerpt related to ${id} and ${item.label}.`,
      evolution: `Explain ${id}'s evolution / power progression in a short in-universe log.`,
    };

    const prompt =
      promptByAction[item.action] ||
      `Scan this object and return an in-universe Nexus readout: ${item.label}.`;

    const res = await nexusClient.chatMind(id, prompt, { localHistory: null });

    if (!res?.reply) {
      setItemData("NEXUS NOT CONNECTED: endpoint mismatch or proxy not installed. (See Status Panel)");
      return;
    }

    const extra =
      res.used_memories?.length
        ? `\n\n[MEMORY HITS]\n- ${res.used_memories.join("\n- ")}`
        : "";

    setItemData(`[NEXUS DATA RETRIEVED]\nObject: ${item.label}\n\n${res.reply}${extra}`);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newHistory = [...chatHistory, { role: "user", content: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage("");

    const res = await nexusClient.chatMind(id, chatMessage, {
      localHistory: newHistory, // Nexus supports this field
    });

    if (!res?.reply) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "[NEXUS OFFLINE] No response. (Proxy/CORS/endpoint)" },
      ]);
      return;
    }

    setChatHistory((prev) => [
      ...prev,
      { role: "assistant", content: res.reply },
    ]);
  };

  const loadHistory = async () => {
    const history = await nexusClient.getChatHistory(id);
    if (history && Array.isArray(history)) {
      setChatHistory(history.map(m => ({
        role: m.role || m.sender || "assistant",
        content: m.content || m.message || String(m)
      })));
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden border border-primary/30 rounded-lg">
      {/* Room Visualizer */}
      <div className={`flex-1 relative ${config.bg} min-h-[500px]`}>
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10 pointer-events-none">
          {/* Grid lines for perspective feel */}
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-primary/30"></div>
          ))}
        </div>

        {/* Room Items */}
        {config.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="absolute group flex flex-col items-center gap-2 transition-transform hover:scale-110 z-10"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)] group-hover:bg-primary/40 animate-pulse">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-mono bg-black/80 px-2 py-1 rounded text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </button>
        ))}

        {/* Chat Button */}
        <div className="absolute bottom-6 right-6 z-20">
          <Button 
            onClick={() => { setChatOpen(true); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.4)]"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Talk to Her
          </Button>
        </div>
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-black/90 border-primary/50 text-primary font-mono">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4" /> Analyzing: {selectedItem?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded min-h-[100px] whitespace-pre-wrap">
            {itemData}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="bg-black/90 border-primary/50 text-primary font-mono max-w-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest">Secure Channel: {id}</DialogTitle>
          </DialogHeader>
          <div className="h-[300px] overflow-y-auto border border-primary/20 p-4 space-y-4 custom-scrollbar bg-primary/5">
            {chatHistory.length === 0 && (
              <div className="text-center text-muted-foreground opacity-50 mt-10">
                - ENCRYPTED CONNECTION ESTABLISHED -
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary-foreground'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleChat} className="flex gap-2 mt-2">
            <input 
              className="flex-1 bg-black border border-primary/30 p-2 text-sm outline-none focus:border-primary"
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />
            <Button type="submit" variant="outline" className="border-primary/30 hover:bg-primary/20">Send</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
