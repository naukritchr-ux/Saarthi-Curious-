import React, { useState, useMemo } from "react";
import { 
  Users, UserCheck, UserX, Clock, Search, Plus, Download, 
  MoreHorizontal, ShieldAlert, CheckCircle2, X, MessageSquare, 
  Sparkles, Send, Shield, Activity, KeyRound
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import caAvatarImg from "../../assets/ca_avatar.png"; // Make sure this path is correct

// Mock Data based on your text file
const INITIAL_USERS = [
  { id: 1, name: "Jiya Shinde", email: "jiyashinde27052005@gmail.com", role: "Admin", manager: "Mousume Barick", location: "Mumbai HQ", last_login: "2026-09-23T13:39:00", logins_30d: 0, is_active: true, status: "Active" },
  { id: 2, name: "Shreya Jain", email: "shreya.jain@talentcorner.in", role: "Admin", manager: "Mousume Barick", location: "Navi Mumbai", last_login: "2026-10-26T08:56:00", logins_30d: 14, is_active: true, status: "Active" },
  { id: 3, name: "Mousume Barick", email: "snehabarick2@gmail.com", role: "Master Admin", manager: "Board Executive", location: "Mumbai HQ", last_login: "2026-10-01T17:55:00", logins_30d: 0, is_active: true, status: "Active" },
  { id: 4, name: "Anuj Jadhav", email: "anujjadhav3558@gmail.com", role: "Admin", manager: "Mousume Barick", location: "Navi Mumbai", last_login: "2026-11-10T14:02:00", logins_30d: 28, is_active: true, status: "Active" },
  { id: 5, name: "Amy Kaul", email: "amy.kaul@talentcorner.in", role: "Franchise Partner", manager: "Shreya Jain", location: "Delhi NCR", last_login: "2026-09-22T19:29:00", logins_30d: 0, is_active: true, status: "Active" },
  { id: 6, name: "Surbhi Jain", email: "surbhi.jain@talentcorner.in", role: "Team Leader", manager: "Shreya Jain", location: "Pune", last_login: "2026-09-19T19:36:00", logins_30d: 0, is_active: true, status: "Active" },
  { id: 7, name: "Atharva Lohar", email: "atharvalohar33@gmail.com", role: "Franchise Employee", manager: "Sasuke Uchiha", location: "Mumbai HQ", last_login: "2026-11-09T11:20:00", logins_30d: 24, is_active: true, status: "Active" },
  { id: 8, name: "Lav Chokhani", email: "bhavana.nimbalkar@talentcorner.in", role: "Franchise Employee", manager: "Vedika Tolani", location: "Bengaluru", last_login: "2026-11-07T16:15:00", logins_30d: 19, is_active: true, status: "Active" },
  { id: 9, name: "Mama Singh", email: "mama.paltasingh@talentcorner.in", role: "Head Office Staff", manager: "Mousume Barick", location: "Mumbai HQ", last_login: "2026-11-04T10:12:00", logins_30d: 11, is_active: true, status: "Active" },
  { id: 10, name: "Shruti Kadam", email: "shruti.kadam@talentcorner.in", role: "Franchise Employee", manager: "Vedika Tolani", location: "Mumbai HQ", last_login: "2026-10-12T09:15:00", logins_30d: 2, is_active: false, status: "Inactive" }
];

export default function UsersAndAccessPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  // Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState([
    { role: "ai", text: "System Telemetry Synced. I've analyzed the user roster. How can I assist you with access control today?" }
  ]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      dormant: users.filter(u => u.logins_30d === 0).length,
      inactive: users.filter(u => !u.is_active).length,
    };
  }, [users]);

  // Filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === "Active") return matchesSearch && u.is_active;
    if (activeFilter === "Inactive") return matchesSearch && !u.is_active;
    if (activeFilter === "Needs Review") return matchesSearch && u.logins_30d === 0;
    return matchesSearch;
  });

  const handleSendAiMessage = (text) => {
    if (!text.trim()) return;
    setAiChatHistory(prev => [...prev, { role: "user", text }]);
    setAiChatInput("");
    
    // Simulate AI response
    setTimeout(() => {
      setAiChatHistory(prev => [...prev, { 
        role: "ai", 
        text: `Based on your current roster: You have ${stats.dormant} users who haven't logged in for 30+ days. I recommend triggering the "Dormant User Nudge" prescription to avoid attrition.` 
      }]);
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#090D1A] text-slate-100 p-6 font-sans relative overflow-hidden">
        
        {/* HERO HEADER (Simple) */}
        <div className="flex flex-wrap justify-between items-center mb-8 bg-gradient-to-r from-[#12101E] to-[#0F111C] border border-white/10 p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl font-black text-white">Users & Access</h1>
            <p className="text-slate-400 text-sm mt-1">Manage profiles, security lifecycles, and AI-driven access reviews.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAiDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.4)]"
            >
              <Sparkles size={16} /> Ask Saarthi AI
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition flex items-center gap-2">
              <Download size={16} /> Export
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* METALLIC KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div onClick={() => setActiveFilter("All")} className={`cursor-pointer kpi-metal-card kpi-metal-purple p-5 flex items-center justify-between ${activeFilter === 'All' ? 'ring-2 ring-white' : ''}`}>
            <div className="kpi-brushed-grain" /><div className="kpi-anisotropic-shine" />
            <div className="relative z-10">
              <p className="text-[11px] font-black tracking-wider text-white/80 uppercase">Total Users</p>
              <p className="text-4xl font-black text-white mt-1 drop-shadow-md">{stats.total}</p>
            </div>
            <div className="relative z-10 p-3 rounded-2xl bg-black/20 border border-white/20 shadow-inner">
              <Users size={24} className="text-white" />
            </div>
          </div>

          <div onClick={() => setActiveFilter("Active")} className={`cursor-pointer kpi-metal-card kpi-metal-emerald p-5 flex items-center justify-between ${activeFilter === 'Active' ? 'ring-2 ring-white' : ''}`}>
            <div className="kpi-brushed-grain" /><div className="kpi-anisotropic-shine" />
            <div className="relative z-10">
              <p className="text-[11px] font-black tracking-wider text-white/80 uppercase">Active Accounts</p>
              <p className="text-4xl font-black text-white mt-1 drop-shadow-md">{stats.active}</p>
            </div>
            <div className="relative z-10 p-3 rounded-2xl bg-black/20 border border-white/20 shadow-inner">
              <UserCheck size={24} className="text-white" />
            </div>
          </div>

          <div onClick={() => setActiveFilter("Needs Review")} className={`cursor-pointer kpi-metal-card kpi-metal-amber p-5 flex items-center justify-between ${activeFilter === 'Needs Review' ? 'ring-2 ring-white' : ''}`}>
            <div className="kpi-brushed-grain" /><div className="kpi-anisotropic-shine" />
            <div className="relative z-10">
              <p className="text-[11px] font-black tracking-wider text-white/80 uppercase">Needs Review (30d+)</p>
              <p className="text-4xl font-black text-white mt-1 drop-shadow-md">{stats.dormant}</p>
            </div>
            <div className="relative z-10 p-3 rounded-2xl bg-black/20 border border-white/20 shadow-inner">
              <Clock size={24} className="text-white" />
            </div>
          </div>

          <div onClick={() => setActiveFilter("Inactive")} className={`cursor-pointer kpi-metal-card kpi-metal-rose p-5 flex items-center justify-between ${activeFilter === 'Inactive' ? 'ring-2 ring-white' : ''}`}>
            <div className="kpi-brushed-grain" /><div className="kpi-anisotropic-shine" />
            <div className="relative z-10">
              <p className="text-[11px] font-black tracking-wider text-white/80 uppercase">Inactive Accounts</p>
              <p className="text-4xl font-black text-white mt-1 drop-shadow-md">{stats.inactive}</p>
            </div>
            <div className="relative z-10 p-3 rounded-2xl bg-black/20 border border-white/20 shadow-inner">
              <UserX size={24} className="text-white" />
            </div>
          </div>

        </div>

        {/* TABLE SECTION */}
        <div className="bg-[#0F111C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#131624]">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text" placeholder="Search users..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#090D1A] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 outline-none" 
              />
            </div>
            <div className="flex gap-2">
              {["All", "Active", "Needs Review", "Inactive"].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`metallic-tab px-4 py-1.5 rounded-lg text-xs ${activeFilter === f ? 'active' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0A0D16] text-[10px] text-slate-400 uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-4 w-10"><input type="checkbox" className="rounded bg-black/50 border-white/20" /></th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role & Location</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Activity (Last Login)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => {
                  const isDormant = user.logins_30d === 0;
                  
                  return (
                    <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-white/5 cursor-pointer transition">
                      <td className="p-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded bg-black/50 border-white/20" /></td>
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">{user.role}</span>
                        <p className="text-[11px] text-slate-500 mt-1">{user.location}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${user.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className={`text-xs font-bold ${isDormant ? 'text-amber-400' : 'text-slate-300'}`}>
                          {isDormant ? "Dormant (30d+)" : "Recent"}
                        </p>
                        <p className="text-[10px] text-slate-500">{user.logins_30d} logins (30d)</p>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            AI AVATAR & CHAT DRAWER
        ===================================================================== */}
        {isAiDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0F111C] border-l border-purple-500/30 h-full flex flex-col shadow-2xl">
              
              {/* AI Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-br from-[#1A1333] to-[#0F111C] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Sparkles className="text-purple-400" size={20} /> Saarthi AI
                    </h2>
                    <p className="text-xs text-purple-300 mt-1">User Lifecycle Assistant</p>
                  </div>
                  <button onClick={() => setIsAiDrawerOpen(false)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                
                {/* Big AI Avatar */}
                <div className="flex justify-center mt-6 relative z-10">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full" />
                    <img src={caAvatarImg} alt="AI Avatar" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* AI Insights (Prescription) */}
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h4 className="text-xs font-black text-amber-300 uppercase flex items-center gap-2 mb-1">
                    <ShieldAlert size={14} /> Attrition Risk
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    I detected <b>{stats.dormant} users</b> dormant for 30+ days. Accounts like <b>Jiya Shinde</b> and <b>Amy Kaul</b> are at high risk of never returning.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <h4 className="text-xs font-black text-emerald-300 uppercase flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} /> AI Prescription
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Trigger the <b>Dormant User Nudge</b> campaign. Send a re-engagement email with a +35 Curos starter reward.
                  </p>
                  <button className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition">
                    Execute Nudge Campaign
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {aiChatHistory.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs max-w-[85%] ${msg.role === 'user' ? 'bg-purple-600 text-white ml-auto' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 bg-[#0A0D16]">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                  <input 
                    type="text" placeholder="Ask about user access..." 
                    value={aiChatInput} onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage(aiChatInput)}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none" 
                  />
                  <button onClick={() => handleSendAiMessage(aiChatInput)} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition">
                    <Send size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

