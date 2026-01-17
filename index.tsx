import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as authUpdateProfile,
  User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore";
import {
  Send,
  User,
  Settings,
  LogOut,
  Users,
  Crown,
  Shield,
  Zap,
  Code,
  Image as ImageIcon,
  Edit2,
  X,
  Menu,
  MessageSquare,
  Globe,
  Loader2
} from 'lucide-react';

// --- Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyDncManQICLPVT8WuMVO5kB-Am32VI12wo",
  authDomain: "chatlaxy-pro.firebaseapp.com",
  projectId: "chatlaxy-pro",
  storageBucket: "chatlaxy-pro.firebasestorage.app",
  messagingSenderId: "807800533954",
  appId: "1:807800533954:web:517cd7d074eb50b9cb9c5b",
  measurementId: "G-M0D68NGRV5"
};

// --- Initialization ---

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Types ---

type Rank = 'User' | 'VIP' | 'Super-VIP' | 'Owner' | 'Developer';

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  photoURL: string;
  bannerURL: string;
  bio: string;
  rank: Rank;
  status: 'online' | 'offline';
  lastSeen: any; // Timestamp
}

interface Message {
  id: string;
  text: string;
  uid: string;
  username: string;
  photoURL: string;
  rank: Rank;
  createdAt: any;
}

// --- Utils ---

const getRankColor = (rank: Rank) => {
  switch (rank) {
    case 'Developer': return 'text-red-500 shadow-red-500/50';
    case 'Owner': return 'text-yellow-400 shadow-yellow-400/50';
    case 'Super-VIP': return 'text-pink-500 shadow-pink-500/50';
    case 'VIP': return 'text-purple-400 shadow-purple-400/50';
    default: return 'text-slate-400';
  }
};

const getRankBadge = (rank: Rank) => {
  switch (rank) {
    case 'Developer': return <Code className="w-4 h-4 mr-1 text-red-500" />;
    case 'Owner': return <Crown className="w-4 h-4 mr-1 text-yellow-400" />;
    case 'Super-VIP': return <Zap className="w-4 h-4 mr-1 text-pink-500" />;
    case 'VIP': return <Shield className="w-4 h-4 mr-1 text-purple-400" />;
    default: return null;
  }
};

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1000&auto=format&fit=crop&q=60";
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// --- Components ---

const RankLabel = ({ rank }: { rank: Rank }) => {
  const colorClass = getRankColor(rank);
  const icon = getRankBadge(rank);
  
  if (rank === 'User') return null;

  return (
    <span className={`flex items-center text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700 ${colorClass.split(' ')[0]} ml-2`}>
      {icon}
      {rank}
    </span>
  );
};

const ProfileModal = ({ 
  user, 
  isOpen, 
  onClose, 
  isOwnProfile,
  onUpdate 
}: { 
  user: UserProfile | null, 
  isOpen: boolean, 
  onClose: () => void,
  isOwnProfile: boolean,
  onUpdate?: (data: Partial<UserProfile>) => void
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    photoURL: '',
    bannerURL: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        photoURL: user.photoURL || '',
        bannerURL: user.bannerURL || '',
        bio: user.bio || ''
      });
      setEditMode(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(formData);
      setEditMode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-white/20 transition text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner */}
        <div className="h-32 w-full relative bg-slate-800">
          <img 
            src={editMode ? (formData.bannerURL || DEFAULT_BANNER) : (user.bannerURL || DEFAULT_BANNER)} 
            className="w-full h-full object-cover"
            alt="Banner" 
          />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="relative">
              <img 
                src={editMode ? (formData.photoURL || DEFAULT_AVATAR) : (user.photoURL || DEFAULT_AVATAR)} 
                className="w-24 h-24 rounded-2xl border-4 border-slate-900 bg-slate-800 object-cover shadow-lg"
                alt="Avatar"
              />
              {user.status === 'online' && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
              )}
            </div>
            
            {isOwnProfile && !editMode && (
              <button 
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
            {editMode && (
              <div className="flex gap-2">
                 <button 
                  onClick={() => setEditMode(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {editMode ? (
            <div className="space-y-4">
               <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Avatar URL</label>
                <input 
                  type="text" 
                  value={formData.photoURL}
                  onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">Banner URL</label>
                <input 
                  type="text" 
                  value={formData.bannerURL}
                  onChange={(e) => setFormData({...formData, bannerURL: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className={`text-xl font-bold text-white`}>
                  {user.username}
                </h2>
                <RankLabel rank={user.rank} />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {user.bio || "No bio yet."}
              </p>
              
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Joined recently</span>
                <span className="capitalize">{user.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const ChatApp = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only for signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Users State
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Auth & Presence ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or Create Profile Listener
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        });

        // Heartbeat for Online Status
        const heartbeat = setInterval(async () => {
          await updateDoc(userRef, {
            status: 'online',
            lastSeen: serverTimestamp()
          });
        }, 60000); // Every minute

        // Initial set online
        await updateDoc(userRef, {
          status: 'online',
          lastSeen: serverTimestamp()
        });

        return () => {
          unsubProfile();
          clearInterval(heartbeat);
        };
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Listeners ---

  useEffect(() => {
    if (!user) return;

    // Listen to messages
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message)).reverse();
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Listen to users for online list (Active in last 5 mins)
    const usersQuery = query(
      collection(db, 'users'), 
      orderBy('lastSeen', 'desc'), 
      limit(20)
    );
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const now = Date.now();
      const users = snapshot.docs.map(doc => {
        const data = doc.data() as UserProfile;
        // Calculate if online based on timestamp (5 min threshold)
        const isOnline = data.lastSeen && (now - data.lastSeen.toMillis() < 5 * 60 * 1000);
        return { ...data, status: isOnline ? 'online' : 'offline' };
      });
      setOnlineUsers(users);
    });

    return () => {
      unsubMessages();
      unsubUsers();
    };
  }, [user]);

  // --- Handlers ---

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (username.length < 3) throw new Error("Username must be at least 3 chars");
        
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        
        // Determine Rank
        let rank: Rank = 'User';
        if (username === 'Developer') rank = 'Developer';

        // Create Profile Doc
        const newProfile: UserProfile = {
          uid,
          username,
          email,
          photoURL: DEFAULT_AVATAR,
          bannerURL: DEFAULT_BANNER,
          bio: 'New to ChatLaxy!',
          rank,
          status: 'online',
          lastSeen: serverTimestamp()
        };

        await setDoc(doc(db, 'users', uid), newProfile);
        await authUpdateProfile(userCred.user, { displayName: username, photoURL: DEFAULT_AVATAR });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      uid: user.uid,
      username: profile.username,
      photoURL: profile.photoURL,
      rank: profile.rank,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
      
      // Update local auth profile as well for consistency
      if (data.username || data.photoURL) {
         await authUpdateProfile(user, {
            displayName: data.username || user.displayName,
            photoURL: data.photoURL || user.photoURL
         });
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-slate-900 text-indigo-500">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  // --- Render: Auth Screen ---

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl mx-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
              ChatLaxy
            </h1>
            <p className="text-slate-400">Join the galactic conversation.</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter username"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">* Set username to 'Developer' for Dev rank.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
            >
              {authMode === 'login' ? 'Enter Command' : 'Initialize Protocol'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
            >
              {authMode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-800 rounded-lg text-white shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 glass-panel border-b-0 border-r-0 border-l-0 border-slate-700/50 flex items-center justify-between px-6 z-20 md:pl-6 pl-16">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500 animate-pulse" />
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              ChatLaxy <span className="text-xs text-slate-500 font-normal ml-2">Global Channel</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {profile && (
               <button onClick={() => setSelectedUser(profile)} className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-lg transition">
                 <div className="text-right hidden sm:block">
                   <div className="text-sm font-bold text-white">{profile.username}</div>
                   <div className={`text-xs ${getRankColor(profile.rank)}`}>{profile.rank}</div>
                 </div>
                 <img src={profile.photoURL || DEFAULT_AVATAR} className="w-9 h-9 rounded-full border border-slate-600 object-cover" />
               </button>
             )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
           <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-slate-900/0"></div>
          
           {messages.map((msg, idx) => {
             const isMe = msg.uid === user.uid;
             const isConsecutive = idx > 0 && messages[idx - 1].uid === msg.uid;
             
             return (
               <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} group relative z-10`}>
                 {!isConsecutive ? (
                   <div 
                      className="cursor-pointer transition hover:scale-105"
                      onClick={() => {
                        // Find user profile from online users or just mock based on message data if simplified
                        const userFromOnline = onlineUsers.find(u => u.uid === msg.uid);
                        if(userFromOnline) setSelectedUser(userFromOnline);
                        else {
                           // Fallback for offline users if we don't fetch individual docs on click (keeping it simple)
                           setSelectedUser({
                              uid: msg.uid,
                              username: msg.username,
                              photoURL: msg.photoURL,
                              rank: msg.rank,
                              bio: "Offline or not recently active.",
                              bannerURL: "",
                              email: "",
                              status: 'offline',
                              lastSeen: null
                           } as UserProfile);
                        }
                      }}
                   >
                     <img 
                      src={msg.photoURL || DEFAULT_AVATAR} 
                      className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover" 
                      alt={msg.username}
                    />
                   </div>
                 ) : (
                   <div className="w-10" />
                 )}
                 
                 <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                   {!isConsecutive && (
                     <div className="flex items-center gap-2 mb-1">
                       <span className={`text-sm font-bold ${isMe ? 'text-indigo-400' : 'text-slate-300'}`}>
                         {msg.username}
                       </span>
                       <RankLabel rank={msg.rank} />
                       <span className="text-[10px] text-slate-600">
                         {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                       </span>
                     </div>
                   )}
                   <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                     isMe 
                       ? 'bg-indigo-600 text-white rounded-tr-none' 
                       : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                   }`}>
                     {msg.text}
                   </div>
                 </div>
               </div>
             );
           })}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 glass-panel border-t border-slate-700/50">
          <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto">
             <div className="relative flex-1">
               <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a transmission..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition shadow-inner"
               />
             </div>
             <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
            >
               <Send className="w-5 h-5" />
             </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Online Users */}
      <div className={`
        fixed inset-y-0 right-0 z-30 w-72 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}
      `}>
         <div className="p-4 border-b border-slate-800 flex justify-between items-center h-16">
            <h2 className="font-bold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4" /> 
              Online - {onlineUsers.filter(u => u.status === 'online').length}
            </h2>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
         </div>

         <div className="overflow-y-auto h-[calc(100%-4rem)] p-2 space-y-1">
            {onlineUsers.map(u => (
              <button 
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition group text-left"
              >
                <div className="relative">
                  <img src={u.photoURL || DEFAULT_AVATAR} className="w-10 h-10 rounded-full bg-slate-800 object-cover" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-slate-900 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-200 truncate text-sm">{u.username}</span>
                      {getRankBadge(u.rank)}
                   </div>
                   <div className="text-xs text-slate-500 truncate">{u.status}</div>
                </div>
              </button>
            ))}
         </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)}
        isOwnProfile={selectedUser?.uid === user.uid}
        onUpdate={handleUpdateProfile}
      />
    </div>
  );
};

// --- Render ---

const root = createRoot(document.getElementById('root')!);
root.render(<ChatApp />);
