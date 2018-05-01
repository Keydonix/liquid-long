FROM node@sha256:dbb1e74774617c46a34f67d25decbdc5841af2a2a08a125a37743c734799b909 as builder
# Docker Tag: node:8.11.1-stretch

ADD ./vendor /tmp/vendor

WORKDIR /build

# install vendor'd tools and dependencies
RUN dpkg -i /tmp/vendor/*.deb

RUN git clone https://github.com/makerdao/sai.git && \
	( cd sai && \
	git checkout 56eed66bb42a485ff0819f4ca227f615b1eb5320 && \
	git submodule update --init --recursive )

# steps to install Nix and DappHub tools
RUN mkdir makertools && cd makertools && \
	git clone https://github.com/dapphub/seth && \
	(cd seth && git checkout de7048815c4953da391b93179af9c2c162e59b23) && \
	git clone https://github.com/dapphub/dapp && \
	(cd dapp && git checkout a426596705be4dfcdd60e7965163453574459dcf) && \
	git clone https://github.com/dapphub/ethsign && \
	(cd ethsign && git checkout d7591c9cac762f15c7087c2d066176bb75ba8095) && \
	git clone https://github.com/keenerd/jshon.git && \
	(cd jshon && git checkout d919aeaece37962251dbe6c1ee50f0028a5c90e4) && \
	make link -C seth prefix=/build/artifacts && \
	make link -C dapp prefix=/build/artifacts && \
	make -C jshon LDFLAGS="-static" && \
	make install -C jshon TARGET_PATH=/build/artifacts/bin

ENV PATH="/build/artifacts/bin:${PATH}"

WORKDIR /build/sai
RUN dapp build
