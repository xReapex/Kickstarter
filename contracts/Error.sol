// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

error ProjectDoesNotExist();
error ProjectClosed();
error ContributionWindowOver();
error SelfContributionForbidden();
error ZeroValue();
error RefundFailed();
error OwnerPaymentFailed();
error GoalNotReached();
error EndMustBeInTheFuture();
error TooManyOpenProjects();
error InsufficientContractBalance();
error DirectEtherNotAllowed();
error NothingToWithdraw();
error NotEnoughBalance();
error ErrorSendingEther();
error NotTheOwner();
error ProjectBalanceNotEmpty();