# Foundry Safe Script

## Actionable folder

1. Admin

   - Scripts only the admin account can run. Edit masterID before deploying script
     1. adminTreasuryUpdate.js - update Treasury address
     2. adminFeeUpdate.js - update fee
     3. adminMinTopUp.js - update minimum top up
     4. adminPublicKeyUpdate.js - update public key
     5. adminAddressUpdate.js - update admin address
   - Run `yarn tsx scripts/actions/{fileName}`

2. Deploy.js

   - Deploy master contract:
     1. Run `yarn tsx scripts/actions/deploy`

3. Viewmasterstate.js:

   - View master contract global states after deployment
     1. Update `masterID`
     2. Run `yarn tsx scripts/actions/viewMasterState`

4. Viewptxndetails.js

   - View details of pending transactions
     1. Update `safeID` and `ptxnID`
     2. Run `yarn tsx scripts/actions/viewPtxnDetails`

5. Viewsafeowners.js

   - View safe owners
     1. Update `safeID`
     2. Run `yarn tsx scripts/actions/viewSafeOwners`

6. Viewsafestate.js
   - View global states of safe contract
     1. Update `safeID`
     2. Run `yarn tsx scripts/actions/viewSafeState`

## Helpers folder

1. Helpers.js
   - Contains function for frontend services
2. Lsigcreator.js
   - Contains function for test cases and Generation of logic sig.
3. Safe.js
   - Contains function for testing, frontend/backend, action scripts and deployment of contract
4. admin.js
   - Contains admin's signer function for updating contract
