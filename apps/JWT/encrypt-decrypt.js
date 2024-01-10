const crypto = require("crypto");

function buildToken(userId, userName) {
  console.log("Build Token");

  let toEncrypt = "";

  if (userId > 0) {
    // Concatenate userId, a unique identifier (e.g., Guid), and optionally UserName
    toEncrypt = `${userId};${generateGuid()}`;

    // Encrypt the concatenated string
    const encryptedString = encryptString(toEncrypt);

    toEncrypt = encryptedString;
  }

  return toEncrypt;
}

function generateGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function encryptString(input) {
  const algorithm = "aes-256-cbc";
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(input, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
}

function stringEncrypt(
  plainText,
  prm_key = null,
  prm_IV = null,
  b64Mode = false
) {
  try {
    if (b64Mode) prm_IV = "741952hheeyy66#cs!9hjv887mxx7@8y";

    prm_key = "YourEncryptionKey"; // Replace with your encryption key
    const workText = plainText;
    const workBytes = Buffer.from(plainText, "utf-8");
    const keyBytes = Buffer.from(getHash(prm_key), "hex");
    let IV;

    if (prm_IV === null) {
      IV = Buffer.from([
        50, 199, 10, 159, 132, 55, 236, 189, 51, 243, 244, 91, 17, 136, 39, 230,
      ]);
    } else {
      IV = Buffer.from(prm_IV, "ascii");
    }

    const cipher = crypto.createCipheriv("aes-256-cbc", keyBytes, IV);

    if (b64Mode) {
      cipher.setAutoPadding(false);
    }

    let encrypted = cipher.update(workBytes, "utf-8", "base64");
    encrypted += cipher.final("base64");

    return encrypted;
  } catch (error) {
    return error.message;
  }
}

function getHash(plainText) {
  try {
    const hashEngine = crypto.createHash("md5");
    const hashBytes = hashEngine.update(plainText, "utf-8").digest("hex");
    return hashBytes;
  } catch (error) {
    return "";
  }
}

// Example usage
// const plainText = "YourPlainText";
// const encryptedText = stringEncrypt(plainText);
// console.log("Encrypted Text:", encryptedText);

// // Example usage
// const userId = 123;
// const userName = "JohnDoe";
// const token = buildToken(userId, userName);

// console.log("Generated Token:", token);

module.exports = { buildToken };
