FROM d62e211afe892e3ee7b9018c8b39798d62d1c9b48e410b20fa4a1f8cc8201f42
#    node:8.11.1-stretch

ADD ./vendor /tmp/vendor

WORKDIR /build

RUN git clone https://github.com/makerdao/sai.git && \
    ( cd sai && \
      git checkout 56eed66bb42a485ff0819f4ca227f615b1eb5320 && \
      git submodule update --init --recursive )

# install tools and dependencies
RUN dpkg -i /tmp/vendor/*.deb

# steps to install Nix and DappHub tools
RUN mkdir makertools && cd makertools && \
        git clone https://github.com/dapphub/seth && \
        (cd seth && git checkout de7048815c4953da391b93179af9c2c162e59b23) && \
        git clone https://github.com/dapphub/dapp && \
        (cd dapp && git checkout a426596705be4dfcdd60e7965163453574459dcf) && \
        git clone https://github.com/dapphub/ethsign && \
        (cd ethsign && git checkout d7591c9cac762f15c7087c2d066176bb75ba8095) && \
        make link -C seth && \
        make link -C dapp

WORKDIR /build/sai
RUN dapp build
