FROM node:8.11.1-stretch
WORKDIR /build

# get PPA solc
RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum

RUN git clone --recurse-submodules https://github.com/makerdao/sai.git

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 1C52189C923F6CA9

# install tools and dependencies
RUN apt-get update && \
        apt-get install -y \
        g++ \
        build-essential \
        wget \
        curl \
        make \
        git \
        sudo \
        file \
        binutils \
        libssl-dev \
        pkg-config \
        libudev-dev \
        solc \
        software-properties-common \
        ethereum \
        bzip2

# steps to install Nix and DappHub tools
RUN mkdir makertools && cd makertools && \
        git clone https://github.com/dapphub/seth && \
        git clone https://github.com/dapphub/dapp && \
        git clone https://github.com/dapphub/ethsign && \
        make link -C seth && \
        make link -C dapp

WORKDIR /build/sai
RUN dapp build
