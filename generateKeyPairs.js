const fs = require("fs");
const os = require("os");
const nacl = require("tweetnacl");

const generateNewKeyPairs = () => {
  const ephemeralKeyPair = nacl.sign.keyPair();

  return [
    {
      key: "SIGNATURE_PUBLIC_KEY",
      value: Buffer.from(ephemeralKeyPair.publicKey).toString("base64"),
    },
    {
      key: "SIGNATURE_SECRET_KEY",
      value: Buffer.from(ephemeralKeyPair.secretKey).toString("base64"),
    },
  ];
};

const setEnvValues = (kvpairs) => {
  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync("./.env", "utf8").split(os.EOL);

  kvpairs.forEach((kv) => {
    // find the env we want based on the key
    const target = ENV_VARS.indexOf(
      ENV_VARS.find((line) => {
        return line.match(new RegExp(kv.key));
      })
    );
    if (target > 0) {
      // replace the key/value with the new value
      ENV_VARS.splice(target, 1, `${kv.key}="${kv.value}"`);
    } else {
      // add new entry
      ENV_VARS.push(`${kv.key}="${kv.value}"`);
    }
  });

  // write everything back to the file system
  fs.writeFileSync("./.env", ENV_VARS.join(os.EOL));
};

const keypairs = generateNewKeyPairs();
setEnvValues(keypairs);
