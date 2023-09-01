import Link from 'next/link'
import R3fCanvas from './r3f_canvas'

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <Link href="/ocean_navigation">Go to Ocean Navigation</Link>
      <br />
      <Link href="/sea_surface">Go to Sea Surface</Link>
      <R3fCanvas />
    </main>
  )
}
