"use client"

import { CID } from 'multiformats/cid'
import styles from './Card.module.css'
import { forwardRef } from 'react'
import type { Player } from '../page'

export type Maybe<T> = T | null
export const IPFS_LINK_PATTERN = 'https://w3s.link/ipfs/{cid}/{path}';

export const httpLink = (uri?: Maybe<string>) => {
  const [, origCID, path] =
    uri?.match(/^(?:ipfs|dweb):(?:\/\/)?([^/]+)(?:\/(.*))?$/) ?? [];

  try {
    if (origCID) {
      const cid = CID.parse(origCID);

      let v0CID = '';
      try {
        v0CID = cid.toV0().toString();
      } catch {}

      let v1CID = '';
      try {
        v1CID = cid.toV1().toString();
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


export const Card = forwardRef<SVGSVGElement, { player: Player }>(
  ({ player: { profile, ethereumAddress } }, ref) => {
    return (
      <section className={styles.card}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 250 400"
          {...{ ref }}
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
            href={profile.profileImageURL ? (
              httpLink(profile.profileImageURL)
            ) : (
              `https://robohash.org/${ethereumAddress}`
            )}
          />
          <text x="125" y="275">
            { profile.name ?? profile.username ?? '𝕌𝕟𝕜𝕟𝕠𝕨𝕟'}
          </text>
        </svg>
      </section>
    )
  }
)

Card.displayName = 'Card'

export default Card