import { expect } from "chai";
import { network } from "hardhat";
const { ethers, networkHelpers } = await network.connect();

describe("Kickstarter", async function () {
    const MAX_OPEN = 2
    let ks: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    // Redeploy contract for each test
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        ks = await ethers.deployContract('Kickstarter', [MAX_OPEN]);
        await ks.waitForDeployment();
    })

    it('should create project if max open project limit not reached', async () => {
        const title = 'Test';
        const goal = ethers.parseEther('3');
        const endTs = (await networkHelpers.time.latest()) + 60;

        // Simulate 
        const id = await ks.createProject.staticCall(title, goal, endTs);

        const tx = await ks.createProject(title, goal, endTs);
        await tx.wait();

        // Get created project
        const project = await ks.projectsById(id);

        expect(project.title).to.equal(title);
        expect(project.owner).to.equal(owner.address);
        expect(project.isOpen).to.equal(true);
        expect(project.goal).to.equal(goal);
        expect(project.endTimestamp).to.equal(endTs);

        // Check if project has been added to owner
        expect(await ks.openProjectsByOwner(owner.address)).to.equal(1);
    });

    it('Should revert if owner try to contribute to his own project', async () => {
        const title = 'Test';
        const goal = ethers.parseEther('3');
        const endTs = (await networkHelpers.time.latest()) + 60;

        // Get id and create
        const id = await ks.createProject.staticCall(title, goal, endTs);
        const tx = await ks.createProject(title, goal, endTs);
        tx.wait()

        // Cannot contribute if owner of the project
        expect(ks.contribute(id)).to.revertedWithCustomError(ks, 'SelfContributionForbidden');
    });

});
