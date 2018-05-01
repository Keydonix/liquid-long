FROM d62e211afe892e3ee7b9018c8b39798d62d1c9b48e410b20fa4a1f8cc8201f42
#    node:8.11.1-stretch

WORKDIR /build

# get PPA solc
RUN apt-get update && apt-get install -y software-properties-common && \
    add-apt-repository ppa:ethereum/ethereum

RUN git clone https://github.com/makerdao/sai.git

WORKDIR /build/sai
RUN git checkout 56eed66bb42a485ff0819f4ca227f615b1eb5320 && \
    git submodule update --init --recursive

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1C52189C923F6CA9

# install tools and dependencies
RUN apt-get update && \
        apt-get install -y \
        solc

# steps to install Nix and DappHub tools
RUN mkdir makertools && cd makertools && \
        git clone https://github.com/dapphub/seth && \
        git clone https://github.com/dapphub/dapp && \
        git clone https://github.com/dapphub/ethsign && \
        make link -C seth && \
        make link -C dapp

WORKDIR /build/sai
RUN dapp build
