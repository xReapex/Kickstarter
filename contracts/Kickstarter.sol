// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Error.sol";

contract Kickstarter is ReentrancyGuard {
    uint256 public immutable maxOpenProject;
    uint256 private nextProjectId;

    struct Project {
        uint256 id;
        bool isOpen;
        uint48 endTimestamp;
        address owner;
        uint256 goal;
        uint256 pledged;
        uint256 withdrawn;
        string title;
    }

    mapping(uint256 => Project) public projectsById;
    mapping(address => uint256[]) public ownerProjectIds;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    constructor(uint256 _maxOpenProjectByOwner) {
        maxOpenProject = _maxOpenProjectByOwner;
    }

    function createProject(
        string memory _title,
        uint256 _goal,
        uint48 _endTimestamp
    ) external returns (uint256 id) {
        if(bytes(_title).length == 0) revert ZeroValue();
        if(_goal == 0) revert ZeroValue();
        if(_endTimestamp <= block.timestamp) revert EndMustBeInTheFuture();
        if(_openProjectsCount(msg.sender) >= maxOpenProject) revert TooManyOpenProjects();

        id = ++nextProjectId;

        projectsById[id] = Project({
            id: id,
            isOpen: true,
            endTimestamp: _endTimestamp,
            owner: msg.sender,
            goal: _goal,
            pledged: 0,
            withdrawn: 0,
            title: _title
        });
        ownerProjectIds[msg.sender].push(id);
    }

    // Accept up to the remaining goal amount; refund any surplus from the last contributor.
    function contribute(uint256 _projectId) external nonReentrant payable {
        Project storage project = projectsById[_projectId];

        if (project.owner == address(0)) revert ProjectDoesNotExist();
        if (!project.isOpen) revert ProjectClosed();
        if (block.timestamp >= project.endTimestamp) revert ContributionWindowOver();
        if (msg.sender == project.owner) revert SelfContributionForbidden();
        if (msg.value == 0) revert ZeroValue();

        // Determine accepted and surplus amounts before writing state
        uint256 balanceBefore = project.pledged - project.withdrawn;
        uint256 remaining = project.goal > balanceBefore ? (project.goal - balanceBefore) : 0;

        uint256 accepted = msg.value <= remaining ? msg.value : remaining;
        uint256 surplus = msg.value - accepted;

        // Update state for accepted part only
        if (accepted > 0) {
            contributions[_projectId][msg.sender] += accepted;
            project.pledged += accepted;
        }

        // Check if goal has been reached
        bool goalReached = (project.pledged - project.withdrawn) >= project.goal;
        if (goalReached) {
            project.isOpen = false;
        }

        // Refund any surplus first
        if (surplus > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: surplus}("");
            if (!refunded) revert RefundFailed();
        }

        // If funded, pay the owner
        if (goalReached) {
            _payOwner(_projectId);
        }
    }

    /**
     * Allow user to withdraw funds if project still open
     */
    function withdraw(uint256 _projectId, uint256 _amount) external nonReentrant{
        Project storage project = projectsById[_projectId];
        uint256 userContribution = contributions[_projectId][msg.sender];

        if (project.owner == address(0)) revert ProjectDoesNotExist();
        if (!project.isOpen) revert ProjectClosed();
        if (_amount == 0) revert ZeroValue();
        if (userContribution == 0) revert NothingToWithdraw();
        if (userContribution < _amount) revert NotEnoughBalance();

        // Change value & send
        contributions[_projectId][msg.sender] = userContribution - _amount;
        project.pledged -= _amount;

        (bool withdrawTx,) = payable(msg.sender).call{value: _amount}("");
        if (!withdrawTx) { revert ErrorSendingEther(); }
    }

    function openProjectsByOwner(address _owner) external view returns (uint256) {
        return _openProjectsCount(_owner);
    }

    function closeProject(uint256 _projectId) external {
        // check sender is owner & check if open and balance empty then set isOpen to false
        Project storage p = projectsById[_projectId];
        if (p.owner == address(0)) { revert ProjectDoesNotExist(); }
        if (msg.sender != p.owner) { revert NotTheOwner(); }
        if (!p.isOpen || (p.pledged - p.withdrawn) != 0) { revert ProjectBalanceNotEmpty(); }

        p.isOpen = false;
    }

    function getAll() external view returns (Project[] memory projects) {
        projects = new Project[](nextProjectId);
        for (uint256 i = 0; i < nextProjectId; i++) {
            projects[i] = projectsById[i + 1];
        }
        return projects;
    }

    // ---------------------- Helpers ---------------------- //

    function _openProjectsCount(address _owner) internal view returns (uint256 count) {
        uint256[] storage ids = ownerProjectIds[_owner];
        for (uint256 i = 0; i < ids.length; i++) {
            if (projectsById[ids[i]].isOpen) {
                unchecked {
                    count++;
                }
            }
        }
    }

    function _getProjectBalance(uint256 _projectId) internal view returns (uint256) {
        Project storage project = projectsById[_projectId];
        return project.pledged - project.withdrawn;
    }

    function _payOwner(uint256 _projectId) internal {
        Project storage project = projectsById[_projectId];
        if (project.isOpen) revert GoalNotReached();

        uint256 toPay = project.goal - project.withdrawn;
        if (toPay == 0) return;

        project.withdrawn += toPay;

        if (address(this).balance < toPay) revert InsufficientContractBalance();
        (bool success, ) = payable(project.owner).call{value: toPay}("");
        if (!success) revert OwnerPaymentFailed();
    }

    receive() external payable { revert DirectEtherNotAllowed(); }
    fallback() external payable { revert DirectEtherNotAllowed(); }
}