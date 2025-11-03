import { Users, Clock, Target } from "lucide-react";
import { ProgressBar } from "./Progressbar.jsx";
import { useEffect, useState } from "react";
import { getPriceCoinGecko } from "../js/priceFeed.js";
import { closeProject, contribute } from '../js/KickstarterManager.js';
import { formatAddress } from "../web3/wallet.jsx";
import { ethers } from "ethers";

function Stat({ icon: Icon, children, title }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
      <Icon className="w-4 h-4" aria-hidden />
      <span className="truncate" title={title}>
        {children}
      </span>
    </div>
  );
}

export function mapOnchainToUI(projectsFromChain) {
  const nowSec = Math.floor(Date.now() / 1000);

  return projectsFromChain.map((p, i) => {
    const owner = p.owner || (p[2] && typeof p[2] === 'string' ? p[2] : "");
    let endTs = 0;
    try {
      endTs = (p.endTimestamp && p.endTimestamp.toNumber) ? p.endTimestamp.toNumber() : Number(p.endTimestamp || 0);
    } catch {
      endTs = Number(p.endTimestamp || 0);
    }

    // Si le projet est fermé, on met "Funded" comme catégorie
    if (!p.isOpen) { p.category = "Funded" };

    return {
      id: p.id,
      title: p.title || `Project #${i + 1}`,
      description: `Created by ${formatAddress(owner)}`,
      goal: p.goal,
      pledged: p.pledged,
      goalRaw: p.goal ? p.goal.toString() : null,
      pledgedRaw: p.pledged ? p.pledged.toString() : null,
      endTimestamp: endTs,
      category: p.category || 'Others',
      isOpen: !!p.isOpen,
      owner,
      withdrawn: !!p.withdrawn,
      image: p.image || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
      _raw: p,
    };
  });
}

export function ProjectCard({ project, onContribute, onRefresh }) {
  const [priceEther, setPriceEther] = useState(null);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localProject, setLocalProject] = useState(project);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [timeLeftStr, setTimeLeftStr] = useState("");

  // Récupère le prix ETH/USD
  useEffect(() => {
    async function fetchPrice() {
      try {
        const price = await getPriceCoinGecko("ethereum", "usd");
        setPriceEther(price);
      } catch (err) {
        console.error("Erreur de récupération du prix :", err);
      }
    }
    fetchPrice();
  }, []);

  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  // Récupère l'adresse connectée
  useEffect(() => {
    let cancelled = false;
    let accountsChangedHandler = null;

    async function getAddress() {
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          setConnectedAddress(null);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        if (!cancelled) setConnectedAddress(addr);
      } catch {
        if (!cancelled) setConnectedAddress(null);
      }

      if (window.ethereum && typeof window.ethereum.on === "function") {
        accountsChangedHandler = (accounts) => {
          if (!accounts || accounts.length === 0) {
            setConnectedAddress(null);
          } else {
            setConnectedAddress(String(accounts[0]));
          }
        };
        window.ethereum.on("accountsChanged", accountsChangedHandler);
      }
    }
    getAddress();

    return () => {
      cancelled = true;
      if (window.ethereum && accountsChangedHandler && typeof window.ethereum.removeListener === "function") {
        window.ethereum.removeListener("accountsChanged", accountsChangedHandler);
      }
    };
  }, []);

  const isOwner = (() => {
    try {
      if (!connectedAddress || !localProject?.owner) return false;
      return connectedAddress.toLowerCase() === String(localProject.owner).toLowerCase();
    } catch {
      return false;
    }
  })();

  const pledgedEth = localProject?.pledged ? Number(ethers.formatEther(localProject.pledged)) : 0;
  const goalEth = localProject?.goal ? Number(ethers.formatEther(localProject.goal)) : 1;

  const pct = Math.round((pledgedEth / goalEth) * 100);
  const reached = pct >= 100;

  // Format du temps restant
  function formatTimeLeft(endTimestamp) {
    const nowSec = Math.floor(Date.now() / 1000);
    let diff = endTimestamp - nowSec;
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / 86400);
    diff %= 86400;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} left`;
    return `${seconds} second${seconds > 1 ? "s" : ""} left`;
  }

  // Intervalle pour mettre à jour le compteur
  useEffect(() => {
    if (!localProject.endTimestamp || !localProject.isOpen) {
      setTimeLeftStr("Ended");
      return;
    }

    const interval = setInterval(() => {
      setTimeLeftStr(formatTimeLeft(localProject.endTimestamp));
    }, 1000);

    setTimeLeftStr(formatTimeLeft(localProject.endTimestamp));

    return () => clearInterval(interval);
  }, [localProject.endTimestamp, localProject.isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isOwner) {
      setError("Owner cannot contribute to this own project");
      return;
    }

    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Saisis un montant valide (> 0).");
      return;
    }

    setLoading(true);
    try {
      const valueWei = ethers.parseEther(String(amount));
      if (typeof onContribute === "function") {
        await onContribute(valueWei, localProject);
      } else {
        await contribute(localProject.id, valueWei);
      }
      if (typeof onRefresh === "function") await onRefresh();

      setAmount("");
      setShowContribute(false);
    } catch (err) {
      console.error("Erreur lors de la contribution : ", err);
      setError(err?.message ? `Échec : ${err.message}` : "Échec de la contribution. Réessaye.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseProject() {
    if (!isOwner) {
      setError("Only the owner can close this project.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await closeProject(localProject.id);
      if (typeof onRefresh === "function") await onRefresh();
      else setLocalProject(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Erreur lors de la fermeture du projet :", err);
      setError(err?.message ? `Échec : ${err.message}` : "Échec de la fermeture du projet.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel(e) {
    e.stopPropagation();
    setError("");
    setAmount("");
    setShowContribute(false);
  }

  return (
    <article className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-xl transition-shadow overflow-hidden">
      <img
        src={localProject.image}
        alt="Illustration du projet"
        className="h-40 w-full object-cover z-0"
        loading="lazy"
      />

      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
        {!showContribute ? (
          isOwner ? (
            <div
              className="cursor-pointer text-white text-sm font-semibold bg-red-500/90 px-5 py-2 rounded-full shadow-lg"
              title="Close this project"
              onClick={handleCloseProject}
            >
              Close this project
            </div>
          ) : (
            !reached && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContribute(true);
                }}
                className="cursor-pointer transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500 ease-out text-white text-sm font-semibold bg-indigo-600/90 px-5 py-2 rounded-full shadow-lg backdrop-blur-sm"
                aria-haspopup="dialog"
              >
                💡 Contribute to this project
              </button>
            )
          )
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/90 dark:bg-black/80 rounded-lg p-4 shadow-lg w-[90%] max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none"
              placeholder="Ex : 0.5"
              aria-label="Amount to contribute"
            />

            <div className="flex items-center justify-between mt-3 gap-2">
              <button
                type="submit"
                disabled={loading || isOwner}
                className="flex-1 text-sm font-semibold px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                title={isOwner ? "👑 Owner cannot contribute" : "Confirm contribution"}
              >
                {loading ? "Loading..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="text-sm px-3 py-2 rounded-md border bg-white dark:bg-neutral-900"
              >
                Cancel
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 relative z-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">
          {localProject.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {localProject.description}
        </p>

        <ProgressBar value={pct} />

        <div className="flex items-end justify-between mt-1">
          <div className="text-sm">
            <span className={`font-semibold ${reached ? "text-green-600" : "text-indigo-600"}`}>
              {pct}%
            </span>{" "}
            <span className="text-gray-500 dark:text-gray-400">funded</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {priceEther
              ? `${(pledgedEth * priceEther).toFixed(2)}$ / ${(goalEth * priceEther).toFixed(2)}$`
              : `${pledgedEth} / ${goalEth} ETH`}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Stat icon={Clock} title={timeLeftStr}>
            {timeLeftStr}
          </Stat>
          <Stat icon={Target} title={localProject.category}>
            {localProject.category}
          </Stat>
        </div>
      </div>
    </article>
  );
}
