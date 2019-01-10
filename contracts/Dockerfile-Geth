FROM keydonix/geth-clique-maker as chain-source


FROM keydonix/geth-clique-node8-solc as builder

ENV ETHEREUM_HTTP=http://localhost:8545
ENV ETHEREUM_GAS_PRICE_IN_NANOETH=1
ENV ETHEREUM_PRIVATE_KEY=fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a
ENV ETHEREUM_OASIS_ADDRESS=0x3c6721551c2ba3973560aef3e11d34ce05db4047
ENV ETHEREUM_MAKER_ADRESS=0x93943fb2d02ce1101dadc3ab1bc3cab723fd19d6
ENV ETHEREUM_PROXY_REGISTRY=0x4ddebcebe274751dfb129efc96a588a5242530ab

COPY --from=chain-source /geth/chain /geth/chain

# cache dependencies when possible
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install

COPY deployment/ /app/deployment/
COPY source/ /app/source/
WORKDIR /app

RUN cd / \
	&& /start.sh & \
	cd /app \
	&& npx ts-node --project deployment/tsconfig.json deployment/scripts/deploy.ts \
	&& kill -TERM $(pidof geth)


FROM keydonix/geth-clique

COPY --from=builder /geth/chain /geth/chain
COPY --from=chain-source /contracts /contracts
