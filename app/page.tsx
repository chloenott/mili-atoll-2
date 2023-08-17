import Link from 'next/link'
import R3fCanvas from './r3f_canvas'

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <Link href="/ocean_navigation">Go to Ocean Navigation</Link>
      <R3fCanvas />
    </main>
  )
}
