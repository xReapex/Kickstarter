import { ethers, ZeroAddress } from "ethers";
import contract from '../../artifacts/contracts/Kickstarter.sol/Kickstarter.json';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const ks = new ethers.Contract(
    CONTRACT_ADDRESS,
    contract.abi,
    signer
);

export async function loadAllKickstarter() {
    const projects = await ks.getAll();
    const formatedProject = [];

    projects.forEach(project => {
        // Only show open && funded
        if (project.isOpen || project.pledged >= project.goal) {
            formatedProject.push({
                id: project.id,
                isOpen: project.isOpen,
                endTimestamp: project.endTimestamp,
                owner: project.owner,
                goal: project.goal,
                pledged: project.pledged,
                withdrawn: project.withdrawn,
                title: project.title,
            })
        }
    });

    return formatedProject;
}

export async function contribute(projectId, amountWei) {
    await (await ks.contribute(Number(projectId), { value: amountWei })).wait();
}

export async function closeProject(projectId) {
    await (await ks.closeProject(projectId)).wait();
}