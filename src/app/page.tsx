"use client"

import styles from './page.module.css'
import dump from '../../public/players.001–010.2023⁄06⁄13@23:55.json'
import Card, { Maybe } from './components/Card'
import { useCallback, useEffect, useRef, useState } from 'react'
import { importer } from 'ipfs-unixfs-importer'
import toIt from 'browser-readablestream-to-it'
import { CarWriter } from '@ipld/car/writer'
import { CID } from 'multiformats/cid'
import parse from 'html-react-parser'

export type Player = typeof dump.data.player[0]
type File = typeof File
type NamedContent = {
  name: string
  content: string
}

class MapBlockStore {
  store = new Map<CID, Uint8Array>()

  constructor () {}
  * blocks() {
    for (const [cid, bytes] of this.store.entries()) {
      yield { cid, bytes }
    }
  }
  put(cid: CID, bytes: Uint8Array) {
    return Promise.resolve(this.store.set(cid, bytes))
  }
  get(cid: CID) {
    return Promise.resolve(this.store.get(cid))
  }
}

export async function svgsToCarIterator(
  svgs: Array<NamedContent>, blockAPI = new MapBlockStore()
)  {
  const entries = svgs.map((svg) => {
    const file = new File(
      [svg.content], svg.name, { type: 'image/svg+xml' },
    )
    return ({
      path: file.name,
      content: toIt(file.stream()),
      // mtime: new Date().getTime(),
      mode: 0o666,
    })
  })
  const options = {
    cidVersion: 1,
    wrapWithDirectory: true,
    rawLeaves: true,
    onProgress: function () { console.debug({ onProgress: arguments }) },
  }
  const fsEntries = []
  for await (const entry of importer(
    entries, blockAPI, options
  )) {
    fsEntries.push(entry)
  }

  if(fsEntries.length === 0) {
    throw new Error('No files found.')
  }

  const root = fsEntries.at(-1)!.cid
  const { writer, out } = CarWriter.create(root)
  for(const block of blockAPI.blocks()) {
    writer.put(block)
  }
  writer.close()

  return { root, out }
}
export default function Home() {
  const image = useRef<SVGSVGElement>(null)
  const link = useRef<HTMLAnchorElement>(null)
  const [genIdx, setGenIdx] = useState(0)
  const [viewIdx, setViewIdx] = useState(0)
  const [images, setImages] = (
    useState<Array<NamedContent>>([])
  )
  const { data: { player: players } } = dump

  useEffect(() => {
    if(genIdx < players.length) {
      const img = image.current?.outerHTML
      if(img) {
        const name = (
          players[genIdx].profile.name
          ?? players[genIdx].profile.username
        )
        setImages((imgs: Array<NamedContent>) => (
          [...imgs, { name, content: img }]
        ))
      }
      setGenIdx((i: number) => i + 1)
    }
  }, [genIdx, players, players.length])

  useEffect(() => {
    let timeoutId: Maybe<NodeJS.Timeout> = null
    const next = async () => {
      await new Promise((resolve) => {
        timeoutId = setTimeout(resolve, 1500)
      })
      setViewIdx((i: number) => {
        const val = (i + 1) % (Math.max(1, images.length))
        console.debug({ i, img: images.length, val })
        return val
      })
    }
    next()

    return () => { timeoutId != null && clearTimeout(timeoutId) }
  }, [images.length, viewIdx])

  const car = useCallback(async () => {
    if(link.current) {
      const outname = `${players.length} Player Images.car`
      const carParts = []
      const { out } = await svgsToCarIterator(images)
      for await (const chunk of out) {
        carParts.push(chunk)
      }
      const car = new Blob(
        carParts, { type: 'application/car' },
      )
      const url = URL.createObjectURL(car)

      link.current.href = url
      link.current.download = outname
      link.current.click()
      // URL.revokeObjectURL(url)
    }
  }, [images, players.length])

  return (
    <main className={styles.main}>
      <aside>View Idx: {viewIdx} / Images Length: {images.length}</aside>
      {viewIdx < images.length && (
        parse(images[viewIdx].content)
      )}
      {genIdx < players.length ? (
        <Card player={players[genIdx]} ref={image}/>
      ) : (
        <button onClick={car}>Download CAR</button>
      )}
      <a ref={link} style={{ display: 'none' }}/>
    </main>
  )
}
