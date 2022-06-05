## GiftSeeker

> App for automatically participate in raffles on different websites.  
> Program developed like a Node.js application. Electron used for UI only.

##### Supported websites

- steamgifts.com
- indiegala.com
- follx.com
- opiumpulses.com
- astats.nl

## Setup

If you are an end user, you can download and install application directly from our website [Download Section](https://giftseeker.ru/downloads).

## Quick start

Make sure you have [Node.js](https://nodejs.org/) **>= 14.15.3** installed, then type the following commands.

1. `git clone https://github.com/codesprut/giftseeker.git`
2. `cd giftseeker`
3. `npm install`
4. `npm run start:ui` or `npm run start:cli`

Now you have a running `desktop` or `cli` application on your screen.

## Structure of the project

The application located in the `src` directory which consists of the following main folders:

- `core` - node.js modules with main app features.
- `modules` - useful independent modules. For example, a storage module.
- `electron` - serves as the app UI using the APIs provided by app modules.
- `console` - cli program implementation.
- `resources` - contains common static files.

## Testing

Run all tests:

```shell
npm run test
```

## Build

We use [electron-builder](https://github.com/electron-userland/electron-builder) module to build our application.

**Use follow commands to build the app:**

Package in a distributable format (e.g. dmg, Windows installer, deb package)

```shell
npm run dist:mac
npm run dist:win
npm run dist:linux
```

The build process compiles the content of the `src` and `node_modules` directories.

## Feedback

Any questions or suggestions?

Here's a list of different ways to me and request help:

- Report bugs and submit feature requests to [GitHub issues](https://github.com/codesprut/giftSeeker/issues)
- And do not forget to join our [Discord server](https://discord.gg/SKYr8z5)!

## Support - help us to grow ;)

- Star ☆ this project repository
- Join our communities on [vk.com](https://vk.com/giftseeker_ru) and [steamcommunity.com](https://steamcommunity.com/groups/GiftSeeker)

## Contributing

Contributions are always welcome!

By participating in this project you agree to abide by [contributor code of conduct](code-of-conduct.md) terms.

## License

MIT ©
