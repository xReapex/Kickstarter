# 🚀 Kickstarter dApp

Un projet décentralisé de Kickstarter permettant de créer et financer des projets en Ether de manière transparente sur Ethereum.

---

## 📝 Description

Cette dApp permet de :

- Créer des projets avec un objectif de financement et une date de fin.
- Contribuer aux projets avec des transactions en ETH.
- Suivre l’avancement des projets via une barre de progression et un compteur de temps.
- Fermer un projet une fois l’objectif atteint ou si le propriétaire le décide.

Toutes les contributions et paiements sont gérés via un **smart contract sécurisé**, avec protection contre les attaques de réentrance et remboursement automatique des surplus.

---

## ⚡ Fonctionnalités

- **Création de projets** : Titre, image, objectif en ETH et date de fin.
- **Contribution** : Les utilisateurs peuvent envoyer des ETH jusqu’à atteindre l’objectif.
- **Remboursement automatique** : Les contributions excédentaires sont retournées.
- **Suivi en temps réel** : Pourcentage financé, montant en ETH/USD, temps restant.
- **Fermeture de projet** : Le propriétaire peut fermer un projet lorsque l’objectif est atteint ou si le projet est terminé.
- **Interface réactive** : Affichage clair des informations du projet et interactions fluides.

---

## 🛠 Stack Technique

- **Blockchain / Smart Contracts** : Solidity 0.8.x
- **Framework Ethereum** : Hardhat
- **Front-end** : React + Tailwind CSS
- **Web3** : ethers.js (v6)
- **Design Icons** : Lucide Icons
- **API de prix** : CoinGecko pour le prix ETH/USD
