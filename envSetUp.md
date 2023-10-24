Duplicate the .env.example file into the same directory and rename it .env
Update NEXT_PUBLIC_DEFAULT_LEDGER to `SandNet`, `TestNet` or `MainNet` to deploy to the respective environments.

# Algod and Indexer Client

Link algod and indexer clients with their api endpoints and the api key. We recommend purestake.io

1. Create a purestake account at [https://developer.purestake.io/](https://developer.purestake.io/)

2. Update ALGOD Client Details based on Network. If you are using Purestake, input API key(token) as a json string. eg.
   NEXT_PUBLIC_ALGOD_TOKEN_TESTNET = '{ "X-API-Key": "api key goes here" }'

### TestNet

1. `NEXT_PUBLIC_ALGOD_ADDRESS_TESTNET`
2. `NEXT_PUBLIC_ALGOD_TOKEN_TESTNET`
3. `NEXT_PUBLIC_ALGOD_PORT_TESTNET`
4. `NEXT_PUBLIC_INDEXER_ADDRESS_TESTNET`
5. `NEXT_PUBLIC_INDEXER_TOKEN_TESTNET`

### MainNet

1. `NEXT_PUBLIC_ALGOD_ADDRESS_MAINNET`
2. `NEXT_PUBLIC_ALGOD_TOKEN_MAINNET`
3. `NEXT_PUBLIC_ALGOD_PORT_MAINNET`
4. `NEXT_PUBLIC_INDEXER_ADDRESS_MAINNET`
5. `NEXT_PUBLIC_INDEXER_TOKEN_MAINNET`

# Database

Create an empty schema in the database you want to use, we recommend using MySQL workbench. Update your database and database authentication details in the database section of the .env file.

1. `TYPEORM_CONNECTION`
2. `TYPEORM_HOST`
3. `TYPEORM_USERNAME`
4. `TYPEORM_PASSWORD`
5. `TYPEORM_DATABASE`

# Master Safe

All created safes are to report to a master app. If you want to use our master app, you have to request the secret key from us. Otherwise you can generate your own public and private key pair. After which, you will need to deploy your master app for your own use.

These key pairs are meant to ensure that all logic signatures created for the pending transactions are signed by the server and verified by the master contract.

## Deploying own master app

1. Generate public and private key pair by running the following commmand in the root directory of the repository.

```
node generateKeyPairs.js
```

2. Update the following values in the `.env`

- `SIGNATURE_SECRET_KEY`
- `SIGNATURE_PUBLIC_KEY`

3. Update treasury address. A portion of the safe creation fees will be sent to this address.

- `TREASURY_ADDR`

4. Deploy the master contract by running the following commands in the root directory of the repository.

```
node scripts/deploy.js
```

4. Update `NEXT_PUBLIC_FOUNDRY_MASTER_SAFE_APP_ID` with the deployed app ID.

## Using Undercurrent Capital Master App

1. Request for the following env values from us if you intend to use our master app ID.

- `NEXT_PUBLIC_FOUNDRY_MASTER_SAFE_APP_ID`
- `SIGNATURE_SECRET_KEY`
- `SIGNATURE_PUBLIC_KEY`

# IPFS link

Update the `NEXT_PUBLIC_IPFS_GATEWAY_URL` variable to display IPFS nfts, we recommend "https://cloudflare-ipfs.com/ipfs/"

# Wallet Connect

Create a cloud WalletConnect v2 account and update these variables `NEXT_PUBLIC_PROJECT_ID` and `NEXT_PUBLIC_PROJECT_ID`.

# Hot Jar

To monitor frontend UI/UX usage and data, create/link your Hotjar Account and update these variables `NEXT_PUBLIC_HJID` and `NEXT_PUBLIC_HJSV`.

# Sentry

Sentry error monitoring allows developers to do error monitoring, create/link your Sentry Account and update this variable `NEXT_PUBLIC_SENTRY_DSN`.

# Admin

The admin page manages the master contract. Only the address stated in this `NEXT_PUBLIC_ADMIN_ADDRESS` will be allowed to access `/admin` and update the master app.
