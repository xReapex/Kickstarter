// App.jsx
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Wallet, LogOut } from "lucide-react";
import { CreateCard } from './components/CreateCard.jsx';
import { CreateKickstarterModal } from './components/Modal.jsx';
import { ProjectCard, mapOnchainToUI } from "./components/ProjectCard.jsx";
import { connectWallet, formatAddress } from "./web3/wallet.jsx";
import { loadAllKickstarter } from './js/KickstarterManager.js';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQ = !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchesC = category === "All Categories" || p.category === category;
      return matchesQ && matchesC;
    });
  }, [projects, query, category]);

  const categories = useMemo(() => [
    "All Categories",
    ...Array.from(new Set(projects.map((p) => p.category || "Others"))),
  ], [projects]);

  const refreshProjects = async () => {
    try {
      const onchain = await loadAllKickstarter();
      const uiProjects = mapOnchainToUI(onchain);
      setProjects(uiProjects);
    } catch (err) {
      console.error("Error refreshing projects:", err);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await connectWallet();
      setAccount(res.account);
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await connectWallet();
        setAccount(res.account);
        await refreshProjects();
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-neutral-950 dark:to-neutral-900 text-gray-900 dark:text-white">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60 border-b border-gray-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Toaster/>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500" />
            <h1 className="text-xl font-bold">Crypto Kickstarter</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 cursor-pointer">
            {account ? (
              <>
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold shadow"
                >
                  <Plus className="w-4 h-4" />
                  Create a kickstarter
                </button>

                <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 px-4 py-2 text-sm font-mono bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300">
                  <Wallet className="w-4 h-4" />
                  {formatAddress(account)}
                  <button
                    onClick={handleDisconnect}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleConnect}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold shadow"
              >
                <Wallet className="w-4 h-4" />
                Connecter le wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="sr-only" htmlFor="search">Search</label>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                id="search"
                placeholder="Search a kickstart"
                className="w-full bg-transparent outline-none text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="sr-only" htmlFor="category">Catégorie</label>
            <select
              id="category"
              className="w-full rounded-2xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CreateCard onOpen={() => setOpen(true)} />

          {filtered.map((p, idx) => (
            <ProjectCard 
              key={p.id ?? idx} 
              project={p} 
              onRefresh={refreshProjects}
            />
          ))}
        </div>
      </main>

      <CreateKickstarterModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={refreshProjects}
      />
    </div>
  );
}