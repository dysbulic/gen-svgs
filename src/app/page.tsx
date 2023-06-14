import Image from 'next/image'
import styles from './page.module.css'
import dump from '../../public/players.001–010.2023⁄06⁄13@23:55.json'
import Card from './components/Card'

export default function Home() {
  const { data: { player: players } } = dump
  return (
    <main className={styles.main}>
      {players.map((player, idx) => (
        <Card {...{ player }} key={idx} />
      ))}
    </main>
  )
}
