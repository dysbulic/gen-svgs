"use client"

import { CID } from 'multiformats/cid'
import styles from './Card.module.css'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import type { Player } from '../page'

export type Maybe<T> = T | null
export const IPFS_LINK_PATTERN = 'https://w3s.link/ipfs/{cid}/{path}';

export function httpLink(uri: string): string
export function httpLink(uri?: null): undefined
export function httpLink(uri?: Maybe<string>) {
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

export const Card = (
  { player: { profile, ethereumAddress }, setReady, index, style = {} }:
  {
    player: Player,
    setReady: (idx: number, img: string) => void,
    index: number,
    style?: React.CSSProperties,
  }
) => {
  const [url, setURL] = useState<string>()
  const [runOnce, setRunOnce] = useState(false)
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const image = async () => {
      const src = profile.profileImageURL ? (
        httpLink(profile.profileImageURL)
      ) : (
        `https://robohash.org/${ethereumAddress}`
      )
      const res = await fetch(src)
      const blob = await res.blob()
      setURL(await new Promise(
        (resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result?.toString())
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }
      ))
    }
    image()
  }, [ethereumAddress, profile.profileImageURL])

  useEffect(() => {
    if(url && ref.current) {
      if(!runOnce) {
        setRunOnce(true)
        setReady(index, ref.current?.outerHTML)
      }
    }
  }, [url, index, setReady, runOnce])

  return (
    <section className={styles.card} {...{ style }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
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
        {url && (
          <image
            width="250" height="250"
            xlinkHref={url}
          />
        )}
        <text x="125" y="275">
          { profile.name ?? profile.username ?? '𝕌𝕟𝕜𝕟𝕠𝕨𝕟'}
        </text>
      </svg>
    </section>
  )
}

Card.displayName = 'Card'

export default Card