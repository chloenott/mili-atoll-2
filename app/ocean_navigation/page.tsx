import Link from 'next/link'
import R3fCanvas from './r3f_canvas'

export default function OceanNavigation() {
  return (
    <main>
      <h1>Ocean Navigation</h1>
      <Link href="/">Go to Home</Link>
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, backgroundImage: 'url(/images/testing.jpg)', backgroundSize: '50%', backgroundPosition: 'center', mixBlendMode: 'multiply', pointerEvents: 'none'}}/>
      <R3fCanvas />
    </main>
  )
}
