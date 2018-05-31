## Building Contracts
```
docker image build -t liquid-long-contract-deployer .
```

## Deploying Contracts
```
docker container run --rm liquid-long-contract-deployer -e ETHEREUM_HTTP -e ETHEREUM_GAS_PRICE_IN_NANOETH -e ETHEREUM_PRIVATE_KEY
```
or
```
set ETHEREUM_HTTP=http://localhost:8545
set ETHEREUM_GAS_PRICE_IN_NANOETH=1
set ETHEREUM_PRIVATE_KEY=fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a
npx ts-node --project deployment/tsconfig.json deployment/scripts/deploy.ts
```

## Testing Deployment
```
docker-compose up --abort-on-container-exit --build --force-recreate
```

## Running the UI
```
npm install -g simple-server
simple-server client
```
