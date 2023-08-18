"use client"

import { CID } from 'multiformats/cid'
import styles from './Card.module.css'
import React, { useEffect, useRef, useState } from 'react'
import type { Player } from '../page'

export type Maybe<T> = T | null
export const IPFS_LINK_PATTERN = 'https://w3s.link/ipfs/{cid}/{path}';

export function httpLink(uri: string): string
export function httpLink(uri?: null): undefined
export function httpLink(uri?: string | null): string | undefined
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

export async function fetchToDataURL(src: string): Promise<string | undefined> {
  const [_, proto, host, rest] = /([^/]*\/\/)([^/]+)\/?(.*)$/.exec(src) ?? []
  if(rest) {
    const parts = rest.split('/').filter((p) => !!p).map(encodeURIComponent)
    console.debug({ _, proto, host, rest, parts })
    src = `${proto}${host}/${parts.join('/')}`
  }

  const res = await fetch(src)
  const blob = await res.blob()
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result?.toString())
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }
  )
}

export const Card = (
  { player: { profile, ethereumAddress, totalXP }, setReady, index, style = {} }:
  {
    player: Player,
    setReady: (idx: number, img: string) => void,
    index: number,
    style?: React.CSSProperties,
  }
) => {
  const [pfpURL, setPfPURL] = useState<string>()
  const [bgURL, setBgURL] = useState<string>()
  const [octoURL, setOctoURL] = useState<string>()
  const [bgOctoURL, setBgOctoURL] = useState<string>()
  const [logoURL, setLogoURL] = useState<string>()
  const [runOnce, setRunOnce] = useState(false)
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const image = async () => {
      const [pfp, bg, octo, bgOcto, logo] = (
        await Promise.all([
          fetchToDataURL(
            httpLink(profile.profileImageURL)
            ?? `https://robohash.org/${ethereumAddress}`
          ),
          fetchToDataURL(
            httpLink(profile.backgroundImageURL)
            ?? '/bg.svg'
          ),
          fetchToDataURL('/octopus.svg'),
          fetchToDataURL('Octopus Dark Foreheaded.svg'),
          fetchToDataURL('MetaGame Logo.png'),
        ])
      )
      setPfPURL(pfp)
      setBgURL(bg)
      setOctoURL(octo)
      setBgOctoURL(bgOcto)
      setLogoURL(logo)
    }
    image()
  }, [ethereumAddress, profile.backgroundImageURL, profile.profileImageURL])

  useEffect(() => {
    if(pfpURL && bgURL && ref.current) {
      if(!runOnce) {
        setRunOnce(true)
        setReady(index, ref.current?.outerHTML)
      }
    }
  }, [index, setReady, runOnce, pfpURL, bgURL])

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
            image.pfp {
              object-fit: contain;
            }
            image.bg {
              object-fit: cover;
            }
            image.octo {
              opacity: 0.5;
            }
            text {
              fill: white;
              text-anchor: middle;
              font-size: 15pt;
              font-weight: bold;
            }
            #front, #back {
              backface-visibility: visible;
              transform-style: preserve-3d;
            }
            #front {
              transform: translate(125px) rotateY(0deg) translate(-125px);
              animation: front-flip 5s infinite;
            }
            #back {
              animation: back-flip 5s infinite;
            }
            @keyframes front-flip {
              0%, 50% {
                opacity: 1;
                transform: translate(125px) rotateY(0deg) translate(-125px);
              }
              70%, 80% {
                opacity: 0;
                transform: translate(125px) rotateY(180deg) translate(-125px);
              }
              100% {
                opacity: 1;
                transform: translate(125px) rotateY(0deg) translate(-125px);
              }
            }
            @keyframes back-flip {
              0%, 50% {
                transform: translate3d(125px, 0, -0.01px) rotateY(180deg) translate3d(-125px, 0, -0.01px);
              }
              70%, 80% {
                transform: translate3d(125px, 0, 0.01px) rotateY(0deg) translate3d(-125px, 0, 0.01px);
              }
              100% {
                transform: translate3d(125px, 0, -0.01px) rotateY(180deg) translate3d(-125px, 0, -0.01px);
              }
            }
          `}</style>
        </defs>
        <g id="back">
          {bgURL && (
            <image
              className="bgOcto"
              x="0" y="0"
              width="250" height="400"
              xlinkHref={bgURL}
            />
          )}
          {bgOctoURL && (
            <image
              className="bgOcto"
              x="-50" y="0"
              width="350" height="300"
              xlinkHref={bgOctoURL}
            />
          )}
          {logoURL && (
            <image
              className="logo"
              x="-25" y="225"
              width="300" height="150"
              xlinkHref={logoURL}
            />
          )}
        </g>
        <g id="front">
          {bgURL && (
            <image
              className="bg"
              x="0" y="0"
              width="250" height="400"
              xlinkHref={bgURL}
            />
          )}
          <image
            className="octo"
            x="0" y="-175"
            width="350" height="400"
            transform="rotate(180 150 200)"
            xlinkHref={octoURL}
          />
          <image
            className="octo"
            x="-50" y="-175"
            width="350" height="400"
            xlinkHref={octoURL}
          />
          <rect
            x="5" y="5" rx="10" ry="10"
            width="240" height="240"
            fill="#FFFFFF88" stroke="black"
          />
          {pfpURL && (
            <image
              className="pfp"
              x="12.5" y="12.5"
              width="225" height="225"
              xlinkHref={pfpURL}
            />
          )}
          <rect
            x="40" y="287.5" rx="10" ry="10"
            width="170" height="40"
            fill="#00000088" stroke="red"
          />
          <rect
            x="10" y="250" rx="10" ry="10"
            width="230" height="40"
            fill="#00000088" stroke="red"
          />
          <text x="125" y="275">
            {profile.name ?? profile.username ?? '𝕌𝕟𝕜𝕟𝕠𝕨𝕟'}
          </text>
          <text x="125" y="315">
            {Math.ceil(totalXP).toLocaleString()} XP
          </text>
        </g>
      </svg>
    </section>
  )
}

Card.displayName = 'Card'

export default Card