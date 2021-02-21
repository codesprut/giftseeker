const builder = require("electron-builder");
const Platform = builder.Platform;

function getCurrentPlatform() {
  switch (process.platform) {
    case "win32":
      return Platform.WINDOWS;
    case "darwin":
      return Platform.MAC;
    case "linux":
      return Platform.linux;
    default:
      console.error("Cannot resolve current platform!");
      return undefined;
  }
}

builder
  .build({
    targets: (process.argv[2] != null && Platform[process.argv[2]] != null
      ? Platform[process.argv[2]]
      : getCurrentPlatform()
    ).createTarget(),
    config: {
      appId: "com.giftseeker.app",
      productName: "GiftSeeker",
      artifactName: "${productName}Setup.${ext}",
      copyright: "Copyright © 2016-2021 Alexander Pinashin",
      files: ["src", "node_modules", "LICENSE"],
      win: {
        target: [
          {
            target: "nsis-web",
            arch: "x64",
          },
          "portable",
        ],
      },
      nsisWeb: {
        oneClick: false,
        perMachine: false,
        allowElevation: true,
        allowToChangeInstallationDirectory: true,
      },
      portable: {
        artifactName: "${productName}.${ext}",
      },
      mac: {
        target: "dmg",
        category: "public.app-category.games",
      },
      linux: {
        target: "AppImage",
        maintainer: "Codesprut",
        vendor: "Codesprut",
        synopsis: "Public giveaways helper",
        description: "Automatically join giveaways",
        category: "Game",
      },
      compression: "maximum",
      extraResources: ["libraries"],
      asar: true,
      publish: {
        provider: "generic",
        url: "https://giftseeker.ru/files",
      },
    },
  })
  .then(() => {
    console.log("Build complete!");
  })
  .catch(err => {
    console.error("Error during build!", err);
  });
