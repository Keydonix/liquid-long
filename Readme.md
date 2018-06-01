## Building Contracts
```
cd contracts
docker image build -t liquid-long-deployer .
```
or
```
cd contracts
npm install
npx ts-node --project deployment/tsconfig.json deployment/scripts/deploy.ts
```

## Building Client
```
cd client
docker image build -t liquid-long-client .
```
or
```
cd client
npm install
npm run integrity
```

## Deploying Contracts
```
cd contracts
docker container run --rm -e ETHEREUM_HTTP -e ETHEREUM_GAS_PRICE_IN_NANOETH -e ETHEREUM_PRIVATE_KEY -e ETHEREUM_OASIS_ADDRESS -e ETHEREUM_MAKER_ADRESS liquid-long-deployer
```
or
```
cd contracts
set ETHEREUM_HTTP=http://localhost:8545
set ETHEREUM_GAS_PRICE_IN_NANOETH=1
set ETHEREUM_PRIVATE_KEY=fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a
set ETHEREUM_OASIS_ADDRESS=0000000000000000000000000000000000000000
set ETHEREUM_MAKER_ADRESS=0000000000000000000000000000000000000000
npx ts-node --project deployment/tsconfig.json deployment/scripts/deploy.ts
```

## Testing Deployment and UI
```
docker-compose up --build --force-recreate
```
then point MetaMask at http://localhost:1235 and browse to http://localhost:1234

## Running the UI
```
cd client
docker container run --rm 1234:80 liquid-long-client
```
or
```
npm install -g simple-server
npm run
simple-server client
```
