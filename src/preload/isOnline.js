// Desc: Checks if the user is connected to the internet
const https = require("https");

export const online = () => {
  return new Promise((resolve) => {
    const request = https.get("https://www.google.com", () => {
      resolve(true);
      request.destroy();
    });

    request.on("error", () => resolve(false));
    request.end();
  });
};
