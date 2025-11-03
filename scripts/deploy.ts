import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "localhost",
});

const ks = await ethers.deployContract('Kickstarter', [10]);
await ks.waitForDeployment();

console.log(`Kickstarter deployed at: ${ks.target}`);