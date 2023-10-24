# Algo Safe

Algo Safe is a set of smart contracts, APIs and SDKs that provide multi-sig allowance-based functionality for use on the Algorand blockchain. It allows any Dapp on Algorand to integrate multi-sig functionality inside it, providing treasury managers the freedom to transact in real time, and finally unlocking the true power of multi-sig on Algorand.

Check out Algo Safe [here](https://safe.algofoundry.studio/)!

## Setup

1. Cloning the project

- Visit the github repository at [https://github.com/Algo-Foundry/algo-safe](https://github.com/Algo-Foundry/algo-safe)
- Clone to your local machine by using git clone or the Github GUI.

2. Installing the packages

- Navigate to the local cloned repository and run the following command.

```
  yarn install
```

3. Set up the .env file

- Follow the instructions [here](envSetUp.md).

4. Run development

```
  yarn dev
```

## Docker

Configure docker container using instructions from [here](./docker.md).

## Testing

Run the following command to run all tests

```
yarn test
```

To run individual test files run the follwing command

```
yarn test <filename>
```

Testing documentation can be found [here](./testCases.md).

## Safe Custom Scripts

We have included a few [custom scripts](./safe.md) to help with the safe deployment and to view the safe details.

## Useful Links

Internal API Document [here](https://documenter.getpostman.com/view/18327269/VUjSH4Wc).
