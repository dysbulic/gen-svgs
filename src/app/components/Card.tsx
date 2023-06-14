"use client"

import { CID } from 'multiformats/cid'
import styles from './Card.module.css'
import { useRef } from 'react';

export type Maybe<T> = T | null
export const IPFS_LINK_PATTERN = 'https://w3s.link/ipfs/{cid}/{path}';

export const httpLink = (uri?: Maybe<string>) => {
  const [, origCID, path] =
    uri?.match(/^(?:ipfs|dweb):(?:\/\/)?([^/]+)(?:\/(.*))?$/) ?? [];

  try {
    if (origCID) {
      const cid = new CID(origCID);

      let v0CID = '';
      try {
        v0CID = cid.toV0().toString();
      } catch {}

      let v1CID = '';
      try {
        v1CID = cid.toV1().toString('base32');
      } catch {}

      const pattern = IPFS_LINK_PATTERN;
      return pattern
        .replace(/{cid}/g, origCID)
        .replace(/{v0cid}/g, v0CID)
        .replace(/{v1cid}/g, v1CID)
        .replace(/{path}/g, path ?? '');
    }
  } catch {}

  return uri ?? undefined; // Image.src won't take null
};


export default function Card({ player }) {
  const image = useRef(null)

  const download = () => {
    console.log({ i: image.current.outerHTML })
  }

  return (
    <section className={styles.card}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 250 400"
        ref={image}
      >
        <defs>
          <style>{`
            text {
              fill: red;
              text-anchor: middle;
            }
          `}</style>
        </defs>
        <image
          width="250" height="250"
          href={httpLink(player.profile.profileImageURL)}
        />
        <text x="125" y="275">{player.profile.name}</text>
      </svg>
      <button onClick={download}>↯</button>
    </section>
  )
}