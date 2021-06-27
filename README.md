## GiftSeeker

App for automatically participate in raffles on different websites.

Program developed like a Node.js application. Electron used for UI only.

##### Supported websites

- steamgifts.com
- indiegala.com
- follx.com
- opiumpulses.com
- astats.nl
- magic-drop.top
- ggplayers.com

## Setup

If you are an end user, you can download and install application directly from our website [Download Section](https://giftseeker.ru/downloads).

## Quick start

Make sure you have [Node.js](https://nodejs.org/) **>= 14.15.3** installed, then type the following commands.

```
git clone https://github.com/CodeSprut/GiftSeeker.git
cd GiftSeeker
npm install
npm start
```

Now you have a running desktop application on your screen.

## Structure of the project

The application located in the `src` directory which consist of three main folders.

`app` - node.js files with main app features.

`electron` - serves as the app UI using the APIs provided by app modules.

`resources` - contains common static files.

## Testing

Run all tests:

```
npm test
```

## Build

We use [electron-builder](https://github.com/electron-userland/electron-builder) module to build our application.

**Use follow commands to build the app:**

Package in a distributable format (e.g. dmg, windows installer, deb package)

```
npm run dist:mac
npm run dist:win
npm run dist:linux
```

The build process compiles the content of the `src` and `node_modules` directories.

## Contact and Support

I want your feedback! Here's a list of different ways to me and request help:

- Report bugs and submit feature requests to [GitHub issues](https://github.com/CodeSprut/GiftSeeker/issues).
- And do not forget to join our [Discord server](https://discord.gg/SKYr8z5)!

### Code of Conduct

[Contributor Code of Conduct](code-of-conduct.md). By participating in this project you agree to abide by its terms.

### License

MIT ©
