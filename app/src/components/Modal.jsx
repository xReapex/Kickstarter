import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { X } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

import contract from '../../artifacts/contracts/Kickstarter.sol/Kickstarter.json';

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = contract.abi;

export function CreateKickstarterModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [goalEth, setGoalEth] = useState(""); // affichage en ETH
  const [endDate, setEndDate] = useState(""); // input type="datetime-local"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successTx, setSuccessTx] = useState(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setGoalEth("");
      setEndDate("");
      setError(null);
      setLoading(false);
      setSuccessTx(null);
    }
  }, [open]);

  const parseEndDateToUnix = (isoString) => {
    if (!isoString) return null; const dt = new Date(isoString);
    if (Number.isNaN(dt.getTime())) return null;
    return Math.floor(dt.getTime() / 1000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    if (!goalEth || Number(goalEth) <= 0) {
      setError("Objectif invalide (doit être > 0).");
      return;
    }
    const endTimestamp = parseEndDateToUnix(endDate);
    if (!endTimestamp || endTimestamp <= Math.floor(Date.now() / 1000)) {
      setError("Date de fin invalide (doit être dans le futur).");
      return;
    }

    if (!window.ethereum) {
      setError("Aucun wallet détecté (MetaMask requis).");
      return;
    }

    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const goalWei = ethers.parseEther(String(goalEth));

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Get id then create
      const id = await contract.createProject.staticCall(title.trim(), goalWei, endTimestamp)
      const tx = await contract.createProject(title.trim(), goalWei, endTimestamp);

      await tx.wait();
      toast.success('Project Created',
        {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );

      const createdProject = {
        owner: signer,
        isOpen: true,
        title: title.trim(),
        goal: Number(goalEth),
        endTimestamp,
        pledged: 0,
        withdrawn: 0,
      };

      // Appel du callback pour mettre à jour la grille
      if (typeof onCreated === "function") {
        onCreated(createdProject);
      }

      setLoading(false);
      onClose();
      setSuccessTx(tx.hash);
    } catch (err) {
      console.error(err);
      // Gestion d'erreurs communes
      if (err.code === 4001) {
        setError("Transaction / connexion refusée par l'utilisateur.");
      } else {
        setError(err.message ? String(err.message) : "Erreur lors de la création.");
      }
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Start a Kickstarter, on-chain</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700"
          >
            <X />
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome project"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Goal (ETH)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={goalEth}
                onChange={(e) => setGoalEth(e.target.value)}
                placeholder="ex: 5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time of end</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          {successTx && (
            <div className="text-sm text-green-600">
              Tx sent: <a className="underline" href={`https://etherscan.io/tx/${successTx}`} target="_blank" rel="noreferrer">{successTx}</a>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-4 py-2 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating..." : "Launch 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
