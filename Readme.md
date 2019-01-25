## Building Contracts
```
cd contracts
npm install
npx ts-node --project ./deployment/tsconfig.json ./deployment/scripts/compile.ts
```

## Deploying the Contracts
```
cd contracts
docker image build -f Dockerfile-Parity -t parity-liquid-long .
docker image build -f Dockerfile-Geth -t geth-liquid-long .
```
or
```
cd contracts
npm install
# set environment variables according to your environment
ETHEREUM_HTTP=http://localhost:8545
ETHEREUM_GAS_PRICE_IN_NANOETH=1
ETHEREUM_PRIVATE_KEY=fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a
ETHEREUM_OASIS_ADDRESS=0x3c6721551c2ba3973560aef3e11d34ce05db4047
ETHEREUM_MAKER_ADRESS=0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6
npx ts-node --project deployment/tsconfig.json deployment/scripts/deploy.ts
```

## Building Client Library
Note: You must first [build the contracts](#building-contracts) to generate
```
cd client-library
docker image build -t liquid-long-client .
```
or
```
cd client-library/library
npm install
npm run build
```

## Testing and Using with a UI
```
docker-compose up --build --force-recreate --renew-anon-volumes
```
then point your UI that uses the library at `http://localhost:1235` (Parity) or `http://localhost:1236` (Geth) and the Liquid Long contract at `0xB03CF72BC5A9A344AAC43534D664917927367487`
