# Linda ROFL Backend

Rust-based ROFL (Runtime Off-chain Logic) backend for Linda location-sharing app.

## Architecture

This backend runs in a Trusted Execution Environment (TEE) on Oasis ROFL and provides:

- **Location Storage**: Stores user locations securely in TEE memory
- **Privacy Filtering**: Applies city/realtime privacy levels when sharing locations
- **Friend Management**: Stores friendships on Sapphire (confidential EVM)
- **Celo Verification**: Verifies user IDs from Self Protocol on Celo network

## Components

### 1. ROFL Container (Rust)
- **`src/main.rs`**: REST API server (Axum)
- **`src/location_store.rs`**: In-memory location storage (TEE)
- **`src/sapphire_client.rs`**: Sapphire contract interaction
- **`src/celo_verifier.rs`**: Celo UID verification

### 2. Sapphire Smart Contract
- **`contracts/FriendManager.sol`**: On-chain friend storage
- Only ROFL container can write (ensured by `onlyRofl` modifier)
- Anyone can read (but locations are filtered by ROFL)

## API Endpoints

### Authentication
- **POST /auth/verify**: Verify Self Protocol auth and Celo UID

### User Management
- **GET /users/:user_id**: Get user profile
- **POST /users/:user_id/location**: Update location
- **POST /users/:user_id/sharing-level**: Update privacy level

### Friends
- **GET /users/:user_id/friends**: Get friends list (from Sapphire)
- **POST /users/:user_id/friends**: Add friend (to Sapphire)
- **DELETE /users/:user_id/friends/:friend_id**: Remove friend
- **GET /users/:user_id/friends/locations**: Get all friends' locations (privacy-filtered)
- **GET /users/:user_id/friends/:friend_id**: Get specific friend's location

## Privacy Levels

| Level | Description | Precision |
|-------|-------------|-----------|
| `city` | City-level location | ~1km (2 decimal places) |
| `realtime` | Exact GPS coordinates | Full precision |

Privacy filtering happens in the ROFL container before sending data to clients.

## Development

### Prerequisites
- Rust 1.75+
- Docker
- Oasis CLI (`oasis` command)

### Local Development

```bash
# Build
cargo build

# Run locally (without TEE)
cargo run

# Test with curl
curl http://localhost:3000/health
```

### Docker Build

```bash
# Build Docker image
docker build -t linda-rofl .

# Run with Docker Compose
docker compose up
```

## ROFL Deployment

### 1. Build Container

```bash
oasis rofl build
```

This creates an `.orc` bundle file.

### 2. Register App (First Time)

```bash
oasis rofl create --network testnet
```

This registers the ROFL app on Sapphire testnet.

### 3. Deploy Sapphire Contract

Deploy `contracts/FriendManager.sol` to Sapphire testnet:

```bash
# Using Hardhat, Foundry, or Remix
# Set ROFL container address in constructor

# Example with Foundry:
forge create --rpc-url https://testnet.sapphire.oasis.dev \
  --private-key <YOUR_KEY> \
  contracts/FriendManager.sol:FriendManager \
  --constructor-args <ROFL_CONTAINER_ADDRESS>
```

Save the contract address.

### 4. Set Environment Variables

```bash
# Set Sapphire contract address
echo -n "0x..." | oasis rofl secret set FRIEND_MANAGER_CONTRACT -

# Set RPC URLs (optional, defaults provided)
echo -n "https://testnet.sapphire.oasis.dev" | oasis rofl secret set SAPPHIRE_RPC_URL -
echo -n "https://alfajores-forno.celo-testnet.org" | oasis rofl secret set CELO_RPC_URL -
```

### 5. Update & Deploy

```bash
# Update with new secrets
oasis rofl update

# Deploy
oasis rofl deploy
```

### 6. Monitor

```bash
# Check machine status
oasis rofl machine show

# View logs
oasis rofl machine logs

# Tail logs
oasis rofl machine logs --follow
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `RUST_LOG` | Log level | `info` |
| `SAPPHIRE_RPC_URL` | Sapphire RPC endpoint | `https://testnet.sapphire.oasis.dev` |
| `CELO_RPC_URL` | Celo RPC endpoint | `https://alfajores-forno.celo-testnet.org` |
| `FRIEND_MANAGER_CONTRACT` | FriendManager contract address | (required) |

## Security Model

### TEE Protection
- **Location data** is stored in TEE memory (never leaves ROFL container unencrypted)
- **Privacy filtering** happens inside TEE before sending to clients
- **Friend checks** verify relationships before sharing locations

### Sapphire Integration
- **Friendships** stored on-chain (confidential smart contract)
- **Only ROFL** can add/remove friends (enforced by contract)
- **ROFL acts as gatekeeper** between users and Sapphire

### Celo Verification
- **Self Protocol** provides DIDs on Celo
- **ROFL verifies** that Celo UID matches claimed user ID
- **Prevents impersonation** of other users

## Implementation Status

### ✅ Completed
- REST API structure
- Location storage (in-memory)
- Privacy filtering logic
- Sapphire contract (FriendManager.sol)
- ROFL configuration

### 🚧 TODO
- [ ] Implement Sapphire contract interaction (`sapphire_client.rs`)
- [ ] Implement Celo UID verification (`celo_verifier.rs`)
- [ ] Add contract ABI generation
- [ ] Add persistent storage for location data
- [ ] Add rate limiting
- [ ] Add authentication middleware

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
cargo clean
cargo build
```

### Contract Deployment Issues
- Ensure you have testnet tokens for Sapphire
- Check that ROFL container address is correct
- Verify RPC URLs are accessible

### Location Not Showing
- Check friendship exists in Sapphire contract
- Verify sharing level is set (not `null`)
- Check ROFL logs for errors

## Resources

- [Oasis ROFL Docs](https://docs.oasis.io/build/rofl/)
- [Sapphire Docs](https://docs.oasis.io/sapphire/)
- [Self Protocol](https://www.self.app/)
- [Celo Alfajores Testnet](https://docs.celo.org/network/alfajores)
