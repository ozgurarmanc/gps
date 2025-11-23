# Linda ROFL Integration Guide

## Overview

This document explains how the Linda app integrates ROFL, Sapphire, and Celo for privacy-preserving location sharing.

## Architecture Diagram

```
┌──────────────┐
│   Frontend   │ (React Native)
│    (User)    │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────────────┐
│   ROFL Container     │ (Rust, TEE)
│  ┌────────────────┐  │
│  │ Location Store │  │ ← In-memory, privacy-filtered
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Celo Verifier  │  │ ← Verifies Self Protocol UID
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │Sapphire Client │  │ ← Reads/writes friendships
│  └────────────────┘  │
└───────┬──────────────┘
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌─────────────┐
│   Sapphire   │   │    Celo     │
│  (Friends)   │   │   (UIDs)    │
└──────────────┘   └─────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User signs in with Self app
    ↓
Self app creates DID on Celo
    ↓
Frontend receives Celo UID
    ↓
Frontend calls /auth/verify with Celo UID + User ID
    ↓
ROFL verifies UID on Celo blockchain
    ↓
If valid, user is authenticated
```

### 2. Location Update Flow

```
User updates location
    ↓
Frontend calls /users/:id/location
    ↓
ROFL stores location in TEE memory
    ↓
Location never leaves TEE unencrypted
```

### 3. Friend Management Flow

```
User adds friend
    ↓
Frontend calls /users/:id/friends
    ↓
ROFL calls Sapphire contract
    ↓
FriendManager.addFriend() stores on-chain
    ↓
Only ROFL can write (enforced by contract)
```

### 4. Location Sharing Flow

```
User requests friends' locations
    ↓
Frontend calls /users/:id/friends/locations
    ↓
ROFL queries Sapphire for friends list
    ↓
For each friend:
  - Get location from TEE store
  - Apply privacy filter (city/realtime)
  - Return filtered location
    ↓
Frontend displays on map
```

## Privacy Guarantees

### TEE Protection (ROFL)
- **Location data** stored in trusted memory
- **Privacy filtering** happens inside TEE
- **Attestation** proves code is running in TEE
- **No direct access** to raw locations

### Sapphire Confidentiality
- **Friend lists** stored on-chain
- **Encrypted state** prevents viewing raw data
- **Access control** enforced by ROFL

### Privacy Levels

| Level | Frontend | ROFL Processing | Friend Sees |
|-------|----------|-----------------|-------------|
| `realtime` | Sends exact GPS | No filtering | Exact coordinates |
| `city` | Sends exact GPS | Rounds to 2 decimals | ~1km precision |

## Security Model

### Trust Assumptions

**Users Trust:**
1. ROFL TEE (hardware attestation)
2. Sapphire smart contract (open source, auditable)
3. Celo blockchain (Self Protocol verification)

**Users Don't Trust:**
1. Server operators (can't see location data)
2. Network observers (HTTPS encrypted)
3. Other users (can't bypass privacy filters)

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|------------|
| Impersonate user | Celo UID verification required |
| See friend's exact location | ROFL applies privacy filter in TEE |
| Bypass friend check | Sapphire contract enforces relationships |
| MITM attack | HTTPS + TEE attestation |
| Compromise server | Location data in TEE only |

## Implementation Checklist

### Backend (ROFL)

- [x] Rust HTTP server (Axum)
- [x] Location storage (in-memory)
- [x] Privacy filtering logic
- [x] Sapphire contract (Solidity)
- [ ] Sapphire client implementation
- [ ] Celo verifier implementation
- [ ] Contract ABI generation
- [ ] Deployment scripts

### Frontend

- [x] Service functions implemented
- [x] API endpoints defined
- [ ] Error handling for network failures
- [ ] Retry logic for ROFL connection
- [ ] Location update interval
- [ ] Background location tracking

### Contracts

- [x] FriendManager.sol written
- [ ] Deploy to Sapphire testnet
- [ ] Get contract address
- [ ] Set ROFL container as admin
- [ ] Verify on block explorer

### Integration

- [ ] Deploy ROFL to Oasis testnet
- [ ] Get ROFL container address
- [ ] Deploy Sapphire contract
- [ ] Configure frontend API_URL
- [ ] Test end-to-end flow
- [ ] Monitor logs

## Testing Guide

### 1. Local Testing (No TEE)

```bash
# Terminal 1: Start ROFL (local)
cd backend
cargo run

# Terminal 2: Start frontend
cd frontend
npm start
```

Test flow:
1. Sign in (dev mode)
2. Set sharing level
3. Update location
4. Add friend
5. View friend's location

### 2. Testnet Testing (With TEE)

```bash
# Deploy ROFL
cd backend
oasis rofl build
oasis rofl create --network testnet
oasis rofl deploy

# Deploy Sapphire contract
# (use Remix, Hardhat, or Foundry)

# Update frontend
cd frontend
# Set EXPO_PUBLIC_API_URL in .env.local
```

## Environment Setup

### Backend (.env)

```bash
PORT=3000
RUST_LOG=info
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
FRIEND_MANAGER_CONTRACT=0x...  # After deployment
```

### Frontend (.env.local)

```bash
EXPO_PUBLIC_API_URL=https://your-rofl-url.oasis.dev
EXPO_PUBLIC_API_PORT=3000
```

## Monitoring & Debugging

### ROFL Logs

```bash
# View ROFL logs
oasis rofl machine logs --follow

# Check for errors
oasis rofl machine logs | grep ERROR
```

### Common Issues

**"Backend not ready" error**
- Check ROFL is deployed: `oasis rofl machine show`
- Verify API_URL in frontend .env.local
- Check network connectivity

**"Not friends" error**
- Verify friendship exists in Sapphire
- Check ROFL can access Sapphire contract
- Ensure contract address is set

**"Celo verification failed"**
- Check Celo RPC URL is accessible
- Verify UID format from Self app
- Check ROFL logs for details

## Next Steps

1. **Implement Sapphire Client**: Complete `sapphire_client.rs` with contract calls
2. **Implement Celo Verifier**: Complete `celo_verifier.rs` with UID verification
3. **Deploy Contracts**: Deploy FriendManager to Sapphire testnet
4. **Test E2E**: Full flow from sign-in to location sharing
5. **Add Monitoring**: Metrics, logging, error tracking
6. **Optimize**: Caching, rate limiting, batch operations

## Resources

- [ROFL Docs](https://docs.oasis.io/build/rofl/)
- [Sapphire Docs](https://docs.oasis.io/sapphire/)
- [Self Protocol](https://www.self.app/)
- [Celo Docs](https://docs.celo.org/)
