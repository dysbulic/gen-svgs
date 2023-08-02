"use client"

import styles from './page.module.css'
import dump from '../../public/players.001–010.2023⁄06⁄13@23:55.json'
import Card from './components/Card'
import { useCallback, useEffect, useRef, useState } from 'react'
import { importer } from 'ipfs-unixfs-importer'
import toIt from 'browser-readablestream-to-it'
import { CarWriter } from '@ipld/car/writer'

export type Player = typeof dump.data.player[0]

class MapBlockStore {
  store = new Map()

  constructor () {}
  * blocks() {
    for (const [cid, bytes] of this.store.entries()) {
      yield { cid, bytes }
    }
  }
  put({ cid, bytes }: { cid: string, bytes: Uint8Array }) {
    return Promise.resolve(this.store.set(cid, bytes))
  }
  get(cid: string) {
    return Promise.resolve(this.store.get(cid))
  }
}

export async function filesToCarIterator(
  files: Array<File>, blockApi = new MapBlockStore()
)  {
  const entries = files.map((file) => ({
    path: `/${file.name}`,
    content: toIt(file.stream()),
  }))
  const options = {
    cidVersion: 1,
    wrapWithDirectory: true,
    rawLeaves: true
  }
  const fsEntries = []
  for await (const entry of importer(
    entries, blockApi, options
  )) {
    fsEntries.push(entry)
  }

  console.info({ entries, fsEntries })

  if(fsEntries.length === 0) {
    throw new Error('No files found.')
  }

  const root = fsEntries.at(-1)!.cid
  const { writer, out } = CarWriter.create(root)
  for (const block of blockApi.blocks()) {
    writer.put(block)
  }
  writer.close()

  return { root, out }
}
export default function Home() {
  const image = useRef<SVGSVGElement>(null)
  const link = useRef<HTMLAnchorElement>(null)
  const [idx, setIdx] = useState(0)
  const [images, setImages] = useState<Array<File>>([])
  const { data: { player: players } } = dump

  type File = typeof File

  useEffect(() => {
    const img = image.current?.outerHTML
    if(img && idx < players.length) {
      const name = (
        players[idx].profile.name
        ?? players[idx].profile.username
      )
      setImages((imgs: Array<File>) => (
        [...imgs, new File(
          [img], name, { type: 'image/svg+xml' }
        ) as unknown as File]
      ))
      setIdx((i: number) => i + 1)
    }
  }, [idx, players, players.length])

  const car = useCallback(async () => {
    if(link.current) {
      const outname = 'PlayerImages.car'
      const carParts = []
      const { root, out } = await filesToCarIterator(images)
      for await (const chunk of out) {
        carParts.push(chunk)
      }
      const car = new Blob(
        carParts, { type: 'application/car' },
      )
      const url = URL.createObjectURL(car)

      console.info({ root: root.toString(), out, url, carParts })

      link.current.href = url
      link.current.download = outname
      link.current.click()
      URL.revokeObjectURL(url)
    }
  }, [images])

  console.info({ images })

  return (
    <main className={styles.main}>
      {idx < players.length ? (
        <Card player={players[idx]} ref={image}/>
      ) : (
        <button onClick={car}>Download CAR</button>
      )}
      <a ref={link} style={{ display: 'none' }}/>
    </main>
  )
}
