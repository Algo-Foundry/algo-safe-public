This document outlines all the test cases that are currently being implemented

# Master contract

## Success Test cases

- Master sc deploys successfully
- Can update the treasury master SC
- Can update the creation fee
- Can update the public key
- Can update the minimum top up amount
- Can update the admin of master SC
- The current admin can interact with any master SC app call
- The creator can interact with any master SC app call

## Negative Test cases

- Cannot initialize with 0 values for treasury and min topup
- Cannot update the creation fee with 0 value
- Cannot update the minimum top up amount with 0 value
- Non admin cannot interact with any master SC app call

# Create Safe

## Success Test cases

- Can successfully initialise safe

## Negative Test cases

- Cannot initialize the safe with treasury fee bigger than it should be
- Cannot initialize when safe already being initialized
- Cannot create the safe with more than 10 owners
- Cannot create safe when the first owner is not the creator
- Cannot initialize the safe with incorrect top up amount
- Cannot initialize the safe with incorrect treasury address
- Cannot create safe with threshold more than number of owners
- Cannot create safe with name length more than 15

# Delete Safe

## Success Test cases

- Owner can initiate remove safe tx
- Owner can vote to reject delete safe
- Owner can vote to approve delete safe
- Owner can cancel Delete Safe Txn when deadlock happens
- Owner can cancel Delete Safe Txn when rejection meets treshold
- Owner can execute Delete Safe Txn when approvals meet threshold

## Negative Test cases

- Non-owner cannot initiate remove safe tx
- Non-owner cannot approve the remote safe tx
- Non-owner cannot remove the safe even if approval threshold is met
- Cannot cancel Delete Safe Txn if rejections has not met threshold and deadlock is not detected
- Cannot execute Delete Safe Txn if approval threshold not met

# Creating ptxn

## Success Test cases

- Can create different types of transactions in payload
- Can create a new pending transaction

## Negative Test cases

- Cannot create a new pending transaction with suspicious program bytes
- Cannot create a pending transaction with invalid signature
- Cannot create a new pending transaction with passed last valid round
- Safe owner cannot create more than 10 ptxn

# Executing ptxn

## Success Test cases

- Can execute its own ptxn payload
- Can do rekey
- Can undo rekey
- Owner can vote approval
- Owner can vote rejection
- Prioritize approval over rejection
- Owner can change their vote, approve -> reject
- Owner can remove the transaction when it has reached rejection threshold
- can remove the transaction when round is invalid

## Negative Test cases

- Cannot execute other ptxn payload when one is already executed
- Non-owner cannot opt into safe
- Owner cannot execute the transaction when it has not met the threshold
- Owner cannot give double approvals
- Cannot do undo rekey without making an app call
- Pending tx cannot be removed when last valid round is still valid
