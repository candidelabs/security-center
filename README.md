# Candide Security Center

<div align="center">
  <img style="border-radius: 8px" width="75%" src="src/icons/logo.png">
</div>

## Getting started

### Install the dependencies:

```bash
yarn
```

### Make a copy of .env.example
```bash
cp -a .env.example .env
```
### Add you own env values:

`REACT_APP_SECURITY_URL`: URL to a locally hosted [security-gateawy](https://github.com/candidelabs/security-gateway)

`REACT_APP_GOERLI_RPC`: Get one from [Ankr](https://www.ankr.com/rpc) or Alchemy

`REACT_APP_MAGIC_LINK_PK`: Get one from [Magic Link](https://magic.link). Use the same one you are using on [candide-mobile-app](https://github.com/candidelabs/candide-mobile-app)


### Start the development server:

```bash
yarn start-dev
```

The project will be running on [localhost:3000](http://localhost:3000)

### SSL
Some wallets require that the website within which it runs be using a https 
connection. If you are testing one of these wallets, Ledger is one, then you have
two options:
 1. Setup a valid certificate for localhost using [this guide](https://www.freecodecamp.org/news/how-to-set-up-https-locally-with-create-react-app/).
 2. Allow invalid certificates for resources loaded from localhost by navigating here within a chrome based browser: [chrome://flags/#allow-insecure-localhost](chrome://flags/#allow-insecure-localhost)
