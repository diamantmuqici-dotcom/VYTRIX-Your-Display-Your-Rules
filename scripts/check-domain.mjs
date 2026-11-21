#!/usr/bin/env node
// Honest DNS check for vytrix.gg. A DNS result is not proof of registration
// or ownership; this script only reports what the resolvers answer today.
import { resolve4, resolve6 } from 'node:dns/promises';

const HOST = process.argv[2] || 'vytrix.gg';

async function check(kind, resolver) {
  try {
    const addresses = await resolver(HOST, { all: true });
    console.log(`${kind}: ${addresses.map((entry) => entry.address).join(', ')}`);
    return addresses.length > 0;
  } catch (error) {
    console.log(`${kind}: no answer (${error.code || error.message})`);
    return false;
  }
}

async function main() {
  console.log(`DNS check for ${HOST}`);
  const v4 = await check('A', resolve4);
  const v6 = await check('AAAA', resolve6);

  if (v4 || v6) {
    console.log('Result: hostname resolves to at least one address.');
  } else {
    console.log('Result: hostname does not resolve from this resolver.');
  }
  console.log('Note: DNS resolution does not establish registration, ownership, or control of the domain.');
}

main().catch((error) => {
  console.error(`check-domain: ${error.message}`);
  process.exitCode = 1;
});
