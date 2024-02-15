const crypto = require("crypto");

function buildToken(userId, userName) {
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

function  getHash(plainText) {
  console.log("plainText>>>>>>" , plainText);
  try {
    const hashEngine = crypto.createHash("md5");
    console.log("hashEngine>>>>" , hashEngine);
    const hashBytes = hashEngine.update(plainText, "utf-8").digest("hex");
    console.log('hashBytes>>>>' , hashBytes);
    return hashBytes;
  } catch (error) {
    return "";
  }
}

function stringDecrypt(
  encrypted,
  prm_key = null,
  prm_IV = null,
  b64Mode = false
) {
  try {
    if (b64Mode) {
      prm_IV = "741952hheeyy66#cs!9hjv887mxx7@8y";
    }

    // Assuming 'EncryptionKey' and 'GetHash' functions need to be defined or replaced as per your application's context
    prm_key = '3s'; // Replace with your key
    const keyBytes = crypto
      .createHash("sha256")
      .update(getHash(prm_key))
      .digest();

      console.log("keyBytes>>>" , keyBytes);
    // Set up the IV
    let IV;
    if (prm_IV === null) {
      IV = Buffer.from([
        50, 199, 10, 159, 132, 55, 236, 189, 51, 243, 244, 91, 17, 136, 39, 230,
      ]);
    } else {
      IV = Buffer.from(prm_IV, "ascii");
    }

    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBytes, IV);
    console.log('>>>>' , decipher);
    if (b64Mode) {
      decipher.setAutoPadding(false);
    }

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    console.log('>>>' , decrypted) ;
    decrypted += decipher.final("utf8");

    let str1 = decrypted.replace(/\0/g, "");
    
    str1 = str1.replace(/a\.m\./g, "AM");
    str1 = str1.replace(/p\.m\./g, "PM");
    console.log('>>>>>>>>>>',str1);

    return str1;
  } catch (ex) {
    console.log('>>>>',ex);
    return ex.message;
  }
}

module.exports = { buildToken, getHash, stringDecrypt, stringEncrypt };
