import Link from 'next/link'
import R3fCanvas from './r3f_canvas'

export default function OceanNavigation() {
  return (
    <main>
      <h1>Ocean Navigation</h1>
      <Link href="/">Go to Home</Link>
      <R3fCanvas />
    </main>
  )
}
